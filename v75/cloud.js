/* Engelsen Anlegg v75 – felles Supabase-kopling. Ingen hemmelege nøklar i nettlesaren. */
(() => {
'use strict';
const cfg=window.SERVICELOGG_SUPABASE||{};
const gate=document.getElementById('cloud-gate');
const message=document.getElementById('cloud-message');
const login=document.getElementById('cloud-login');
const confirmForm=document.getElementById('cloud-confirm');
const status=document.getElementById('cloud-status');
const statusText=document.getElementById('cloud-status-message');
const mappings={
 'servicelogg.maskiner.v1':['machines','array'],
 'servicelogg.forhandlarar.v1':['dealers','array'],
 'servicelogg.mekanikarar.v1':['mechanics','array'],
 'servicelogg.mekanikarstatus.v1':['mechanic_statuses','object'],
 'servicelogg.service.v1':['service','array'],
 'servicelogg.serviceintervall.v1':['intervals','array'],
 'servicelogg.serviceintervall.gjeld.v1':['interval_selected','scalar'],
 'servicelogg.feilmeldingar.v1':['faults','array']
};
const backupKey='servicelogg.precloud.backup.v75';
const NativeSet=Storage.prototype.setItem,NativeRemove=Storage.prototype.removeItem;
let client,profile,user,staff=[],ready=false,syncRunning=false;
const snapshots=new Map(),pending=new Set();
const oldText=(text)=>{message.textContent=text;};
const errString=(e)=>e?.message||String(e);
function setStatus(text,bad=false){status.hidden=false;statusText.textContent=text;status.style.background=bad?'#a82d29':'#143b65';}
function showLogin(text='Logg inn med e-post og PIN for å opna den felles ServiceLogg.'){
  confirmForm.hidden=true;login.hidden=false;oldText(text);
}
function showConfirm(){login.hidden=true;confirmForm.hidden=false;oldText('Stillinga di må stadfestast før du får tilgang.');}
function stableId(item,index){
  if(item&&typeof item==='object'&&item.id)return String(item.id);
  return 'key:'+JSON.stringify(item===undefined?null:item).slice(0,500);
}
function decodeRows(bucket,format,rows){
  const items=rows.filter(r=>r.bucket===bucket).map(r=>({item_id:r.item_id,payload:r.payload}));
  if(format==='array') return JSON.stringify(items.map(x=>x.payload));
  if(format==='object') return JSON.stringify(Object.fromEntries(items.map(x=>[x.item_id,x.payload])));
  return items.length ? String(items[0].payload?.value??'') : null;
}
function encodeLocal(key){
  const [bucket,format]=mappings[key];let val=localStorage.getItem(key);
  let parsed;try{parsed=JSON.parse(val||'null')}catch(e){parsed=null}
  const output=new Map();
  if(format==='array'){
    if(!Array.isArray(parsed))parsed=[];
    parsed.forEach((item,index)=>output.set(stableId(item,index),item));
  }else if(format==='object'){
    if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))Object.entries(parsed).forEach(([id,item])=>output.set(id,item));
  }else if(val!==null && val.trim()!=='') output.set('singleton',{value:val});
  return output;
}
function equal(a,b){return JSON.stringify(a)===JSON.stringify(b);}
async function allRecords(){
  let result=[],start=0;
  while(true){
    const {data,error}=await client.from('app_records').select('bucket,item_id,payload,created_by,updated_at').range(start,start+999);
    if(error)throw error;
    result.push(...data);
    if(data.length<1000)break;
    start+=1000;
    if(start>50000)throw new Error('For mange registreringar. Kontroller databasen.');
  }
  return result;
}
function maybeBackupLocal(){
  if(localStorage.getItem(backupKey))return;
  const previous={};
  for(const key of Object.keys(mappings)){
    const val=localStorage.getItem(key);
    if(val!==null&&val!==''&&val!=='[]'&&val!=='{}')previous[key]=val;
  }
  if(Object.keys(previous).length)NativeSet.call(localStorage,backupKey,JSON.stringify({time:new Date().toISOString(),values:previous}));
}
function hydrate(records){
  for(const [key,[bucket,format]]of Object.entries(mappings)){
    const current=new Map(records.filter(r=>r.bucket===bucket).map(r=>[r.item_id,r.payload]));
    snapshots.set(key,current);
    const encoded=decodeRows(bucket,format,records);
    if(encoded===null)NativeRemove.call(localStorage,key);
    else NativeSet.call(localStorage,key,encoded);
  }
}
function visibleProfile(row){return {id:row.id,email:row.email,full_name:row.full_name,role:row.role,confirmed:row.confirmed,created_at:row.created_at};}
async function fetchStaff(){
  const {data,error}=await client.from('staff_profiles').select('id,email,full_name,role,confirmed,created_at,disabled').order('created_at',{ascending:true});
  if(error)throw error;
  return (data||[]).filter(r=>!r.disabled).map(visibleProfile);
}
async function loadProfile(){
  const {data:{user:u},error:authError}=await client.auth.getUser();
  if(authError||!u)throw new Error('Kunne ikkje stadfesta innlogginga');
  user=u;
  const {data,error}=await client.from('staff_profiles').select('id,email,full_name,role,confirmed,disabled,created_at').eq('id',u.id).single();
  if(error||!data)throw new Error('Kontoen finst i innlogginga, men manglar ei godkjend stilling. Kontakt administrator.');
  if(data.disabled)throw new Error('Kontoen er deaktivert. Kontakt administrator.');
  profile=visibleProfile(data);
  return profile;
}
async function afterAuth(){
  try{
    oldText('Hentar konto frå Supabase …');
    await loadProfile();
    if(!profile.confirmed){showConfirm();return;}
    login.hidden=true;confirmForm.hidden=true;
    oldText('Hentar felles maskinar og feilmeldingar …');
    staff=await fetchStaff();
    const rows=await allRecords();
    maybeBackupLocal();
    hydrate(rows);
    const cloud={client,profile,user,staff,tempCodes:{},refreshStaffUI:null,
      saveStaff,manageStaff,signOut,importLegacy,refresh:()=>location.reload()};
    window.ServiceCloud=cloud;
    const script=document.createElement('script');
    script.src='legacy.js';
    script.onload=()=>{
      ready=true;
      document.body.classList.remove('cloud-locked');
      gate.hidden=true;
      status.hidden=false;
      setStatus('✓ Felles database tilkopla');
      document.getElementById('cloud-refresh').onclick=()=>location.reload();
      document.getElementById('cloud-export').onclick=exportBackup;
      const importBtn=document.getElementById('cloud-import');
      importBtn.hidden=profile.role!=='administrator'||!localStorage.getItem(backupKey);
      importBtn.onclick=importLegacy;
      startPolling();
    };
    script.onerror=()=>oldText('Kunne ikkje lasta inn ServiceLogg-koden (legacy.js). Kontroller at alle filene ligg i same mappe.');
    document.body.appendChild(script);
  }catch(e){showLogin('Innlogginga kunne ikkje opnast: '+errString(e));}
}
async function signOut(){
  try{await flushAll()}catch(e){}
  ready=false;
  await client.auth.signOut();
  location.reload();
}
const errorOf=result=>result.error || (result.data?.error?new Error(result.data.error):null);
async function manageStaff(action,args){
  if(profile?.role!=='administrator')throw new Error('Berre administrator kan endra tilsette');
  try{
    const result=await client.functions.invoke('manage-staff',{body:{action,...args}});
    if(errorOf(result))throw errorOf(result);
    const data=result.data||{};
    if(data.code&&data.id)window.ServiceCloud.tempCodes[data.id]=data.code;
    staff=await fetchStaff();window.ServiceCloud.staff=staff;
    const revealId=data.id||args.id;
    if(window.ServiceCloud.refreshStaffUI)window.ServiceCloud.refreshStaffUI(staff,revealId);
    if(data.code)window.alert('Stadfestingskode for '+(staff.find(s=>s.id===data.id)?.full_name||'den tilsette')+':\n\n'+data.code+'\n\nDel denne koden privat. PIN må delast separat.');
    return data;
  }catch(e){window.alert('Kunne ikkje lagra tilsett i felles database: '+errString(e));throw e;}
}
async function saveStaff({id,name,email,role,pin}){
  const args={id,name:String(name||'').trim(),email:String(email||'').trim().toLowerCase(),role,pin:String(pin||'')};
  if(!args.name||!/^\S+@\S+\.\S+$/.test(args.email))return window.alert('Skriv inn namn og gyldig e-post.');
  if(!['administrator','servicefolk','maskinforar','lastebilsjafor','altmulig'].includes(args.role))return window.alert('Vel ei gyldig stilling.');
  if((!id||pin)&&!/^\d{8}$/.test(args.pin))return window.alert('PIN må vera nøyaktig 8 siffer i nettutgåva.');
  if(!id)delete args.id;
  if(id&&!pin)delete args.pin;
  return manageStaff(id?'update':'create',args);
}
function queueSync(key){
  if(!ready||!mappings[key])return;
  if(!hasWriteRights(mappings[key][0]))return;
  pending.add(key);setStatus('Lagrar i felles database …');
  void flushAll();
}
function hasWriteRights(bucket){return profile.role==='administrator'||profile.role==='servicefolk'||bucket==='faults';}
async function syncKey(key){
  const [bucket]=mappings[key];
  const current=encodeLocal(key),previous=snapshots.get(key)||new Map();
  if(!hasWriteRights(bucket))return;
  const added=[...current].filter(([id,p])=>!previous.has(id));
  const changed=[...current].filter(([id,p])=>previous.has(id)&&!equal(p,previous.get(id)));
  const removed=[...previous.keys()].filter(id=>!current.has(id));
  for(const [id,payload]of added){
    const r=await client.from('app_records').insert({bucket,item_id:id,payload,created_by:user.id});
    if(r.error)throw r.error;
    previous.set(id,payload);
  }
  for(const [id,payload]of changed){
    const r=await client.from('app_records').update({payload}).eq('bucket',bucket).eq('item_id',id);
    if(r.error)throw r.error;
    previous.set(id,payload);
  }
  for(const id of removed){
    const r=await client.from('app_records').delete().eq('bucket',bucket).eq('item_id',id);
    if(r.error)throw r.error;
    previous.delete(id);
  }
  snapshots.set(key,previous);
}
async function flushAll(){
  if(syncRunning||!ready)return;
  syncRunning=true;
  try{
    while(pending.size){
      const key=pending.values().next().value;pending.delete(key);
      try{await syncKey(key)}catch(e){pending.add(key);setStatus('⚠️ Ikkje lagra sentralt: '+errString(e),true);return;}
    }
    setStatus('✓ Alt lagra i felles database');
  }finally{syncRunning=false;}
}
Storage.prototype.setItem=function(key,value){
  const result=NativeSet.call(this,key,value);
  if(this===localStorage && ready && Object.hasOwn(mappings,String(key)))queueSync(String(key));
  return result;
};
Storage.prototype.removeItem=function(key){
  const result=NativeRemove.call(this,key);
  if(this===localStorage && ready && Object.hasOwn(mappings,String(key)))queueSync(String(key));
  return result;
};
window.addEventListener('online',()=>void flushAll());
async function exportBackup(){
  const data={version:75,createdAt:new Date().toISOString(),values:{}};
  for(const key of Object.keys(mappings))data.values[key]=localStorage.getItem(key);
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='Engelsen-ServiceLogg-sikkerheitskopi.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
}
async function importLegacy(){
  if(profile.role!=='administrator')return;
  const saved=localStorage.getItem(backupKey);if(!saved)return window.alert('Ingen tidlegare lokale data er funne på denne nettadressa.');
  const legacy=JSON.parse(saved);const values=legacy.values||{};
  const current=await allRecords();
  const existing=new Set(current.map(r=>r.bucket+'::'+r.item_id));
  let count=0;
  if(!confirm('Vil du importera gamle lokale maskinar, serviceføringar og feilmeldingar frå denne nettlesaren til felles database? Data som finst frå før, blir ikkje overskrivne.'))return;
  for(const [key,[bucket,format]]of Object.entries(mappings)){
    if(!values[key])continue;
    let parsed;try{parsed=JSON.parse(values[key]);}catch(e){if(format==='scalar')parsed=values[key];else continue;}
    let items=[];
    if(format==='array'&&Array.isArray(parsed))items=parsed.map((p,i)=>({id:stableId(p,i),payload:p}));
    else if(format==='object'&&parsed&&typeof parsed==='object')items=Object.entries(parsed).map(([id,payload])=>({id,payload}));
    else if(format==='scalar'&&parsed)items=[{id:'singleton',payload:{value:String(parsed)}}];
    for(const item of items){
      if(existing.has(bucket+'::'+item.id))continue;
      const r=await client.from('app_records').insert({bucket,item_id:item.id,payload:item.payload,created_by:user.id});
      if(r.error){window.alert('Import stoppa: '+errString(r.error));return;}
      count++;
    }
  }
  window.alert(count+' registreringar er importerte. Sida blir oppdatert.');
  location.reload();
}
async function startPolling(){
  setInterval(async()=>{
    if(!ready||pending.size||syncRunning)return;
    try{
      const rows=await allRecords();
      const local=[...snapshots].flatMap(([key,map])=>[...map.keys()].map(id=>mappings[key][0]+':'+id)).sort();
      const remoteNames=rows.map(r=>r.bucket+':'+r.item_id).sort();
      if(JSON.stringify(local)!==JSON.stringify(remoteNames))setStatus('Andre har lagt til eller sletta data – trykk «Oppdater data»');
    }catch(e){}
  },45000);
}
login.addEventListener('submit',async e=>{
  e.preventDefault();const btn=document.getElementById('cloud-login-btn');btn.disabled=true;
  oldText('Kontrollerer e-post og PIN …');
  try{
    const {error}=await client.auth.signInWithPassword({email:document.getElementById('cloud-email').value.trim(),password:document.getElementById('cloud-pin').value});
    if(error)throw error;
    document.getElementById('cloud-pin').value='';
    await afterAuth();
  }catch(e){showLogin('Feil ved innlogging: '+errString(e));}
  finally{btn.disabled=false;}
});
confirmForm.addEventListener('submit',async e=>{
  e.preventDefault();const btn=document.getElementById('cloud-confirm-btn');btn.disabled=true;
  try{
    const code=document.getElementById('cloud-code').value.trim();
    const result=await client.functions.invoke('confirm-staff',{body:{code}});
    if(errorOf(result))throw errorOf(result);
    document.getElementById('cloud-code').value='';
    await afterAuth();
  }catch(e){showConfirm();oldText('Stadfesting mislukkast: '+errString(e));}
  finally{btn.disabled=false;}
});
document.getElementById('cloud-confirm-logout').onclick=signOut;
(async()=>{
  if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(cfg.url||'')||!cfg.publishableKey||cfg.publishableKey.includes('SET_INN')){
    oldText('Denne versjonen er ikkje kopla til Supabase enno. Fyll inn prosjekt-URL og publiserbar nøkkel i config.js og køyr databaseoppsettet i Supabase. Ingen må oppretta lokale kontoar her.');
    return;
  }
  if(!window.supabase?.createClient){oldText('Kunne ikkje lasta Supabase-klienten. Sjekk internett og CDN-tilgangen.');return;}
  client=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{storage:sessionStorage,persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
  const {data:{session},error}=await client.auth.getSession();
  if(error||!session)showLogin();else await afterAuth();
})();
})();
