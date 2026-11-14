// Supabase Edge Function. Service-role-nøkkelen blir berre brukt på serveren.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
const json = (body:unknown,status=200) => new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
const roles=['administrator','servicefolk','maskinforar','lastebilsjafor','altmulig'];
const emailOK=(v:unknown)=>typeof v==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)&&v.length<254;
const pinOK=(v:unknown)=>typeof v==='string'&&/^\d{8}$/.test(v);
const randomString=(n:number)=>Array.from(crypto.getRandomValues(new Uint8Array(n)),x=>x.toString(16).padStart(2,'0')).join('');
const newCode=()=>String(100000+crypto.getRandomValues(new Uint32Array(1))[0]%900000);
const digest=async(value:string,salt:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(salt+value))),x=>x.toString(16).padStart(2,'0')).join('');
Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('',{headers:cors});
  if(req.method!=='POST')return json({error:'Berre POST er støtta'},405);
  try{
    const token=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');
    if(!token)return json({error:'Du må logga inn'},401);
    const url=Deno.env.get('SUPABASE_URL')!;
    const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const client=createClient(url,secret,{auth:{autoRefreshToken:false,persistSession:false}});
    const {data:{user},error:userError}=await client.auth.getUser(token);
    if(userError||!user)return json({error:'Ugyldig innlogging'},401);
    const {data:caller,error:ce}=await client.from('staff_profiles').select('role,confirmed,disabled').eq('id',user.id).single();
    if(ce||!caller||!caller.confirmed||caller.disabled||caller.role!=='administrator')return json({error:'Berre administrator kan endra tilsette'},403);
    const body=await req.json();const action=body.action;
    if(action==='create'){
      const email=String(body.email||'').trim().toLowerCase();const name=String(body.name||'').trim();
      if(!emailOK(email)||!name||name.length>120||!roles.includes(body.role)||!pinOK(body.pin))return json({error:'Fyll inn namn, e-post, stilling og ein PIN på nøyaktig 8 siffer.'},400);
      const {data:created,error:ae}=await client.auth.admin.createUser({email,password:body.pin,email_confirm:true});
      if(ae||!created.user)return json({error:ae?.message||'Brukaren kunne ikkje opprettast'},400);
      const id=created.user.id;const code=newCode(),salt=randomString(16);
      const {error:pe}=await client.from('staff_profiles').insert({id,email,full_name:name,role:body.role,confirmed:false,confirm_hash:await digest(code,salt),confirm_salt:salt,confirm_attempts:0,locked_until:null});
      if(pe){await client.auth.admin.deleteUser(id);return json({error:'Kunne ikkje registrera tilsett i databasen'},500)}
      return json({id,code,message:'Tilsett oppretta. Del PIN og stadfestingskode kvar for seg.'});
    }
    const id=String(body.id||'');if(!/^[0-9a-f-]{36}$/i.test(id))return json({error:'Ugyldig brukar-ID'},400);
    const {data:target,error:te}=await client.from('staff_profiles').select('id,email,full_name,role,confirmed').eq('id',id).single();
    if(te||!target)return json({error:'Fann ikkje tilsett'},404);
    const wouldRemoveAdmin=action==='delete'||(action==='update'&&body.role!=='administrator');
    if(wouldRemoveAdmin&&target.role==='administrator'){
      const {count}=await client.from('staff_profiles').select('id',{head:true,count:'exact'}).eq('role','administrator').eq('disabled',false).eq('confirmed',true);
      if((count||0)<=1)return json({error:'Den siste administratoren kan ikkje slettast eller nedgraderast'},409);
    }
    if(action==='delete'){
      const {error}=await client.auth.admin.deleteUser(id);
      if(error)return json({error:error.message},400);
      return json({ok:true});
    }
    if(action==='pin'){
      if(!pinOK(body.pin))return json({error:'PIN må vera nøyaktig 8 siffer'},400);
      const {error}=await client.auth.admin.updateUserById(id,{password:body.pin});
      if(error)return json({error:error.message},400);
      return json({ok:true});
    }
    if(action==='rotate'||action==='update'){
      let update:Record<string,unknown>={};let rotate=action==='rotate';
      if(action==='update'){
        const name=String(body.name||'').trim(),email=String(body.email||'').trim().toLowerCase();
        if(!name||name.length>120||!emailOK(email)||!roles.includes(body.role))return json({error:'Ugyldige namn/e-post/stilling'},400);
        if(body.pin&&!pinOK(body.pin))return json({error:'PIN må vera nøyaktig 8 siffer'},400);
        const authUpdates:Record<string,unknown>={};
        if(email!==target.email)authUpdates.email=email;
        if(body.pin)authUpdates.password=body.pin;
        if(Object.keys(authUpdates).length){const{error}=await client.auth.admin.updateUserById(id,authUpdates);if(error)return json({error:error.message},400);}
        update={email,full_name:name,role:body.role};
        rotate=body.role!==target.role||email!==target.email||!target.confirmed;
      }
      let code='';
      if(rotate){code=newCode();const salt=randomString(16);Object.assign(update,{confirmed:false,confirm_hash:await digest(code,salt),confirm_salt:salt,confirm_attempts:0,locked_until:null});}
      const {error}=await client.from('staff_profiles').update(update).eq('id',id);
      if(error)return json({error:error.message},500);
      return json({ok:true,id,code:code||undefined});
    }
    return json({error:'Ukjend handling'},400);
  }catch(e){return json({error:'Tenestefeil. Prøv igjen, eller sjekk Supabase Functions-loggen.'},500)}
});
