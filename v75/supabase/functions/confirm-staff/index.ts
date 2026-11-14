// Supabase Edge Function – stadfesting av stilling med privat kode.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
const digest=async(value:string,salt:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(salt+value))),x=>x.toString(16).padStart(2,'0')).join('');
function equal(a:string,b:string){if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('',{headers:cors});
 if(req.method!=='POST')return json({error:'Berre POST'},405);
 try{
   const token=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');
   if(!token)return json({error:'Logg inn med e-post og PIN fyrst'},401);
   const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{autoRefreshToken:false,persistSession:false}});
   const {data:{user},error}=await client.auth.getUser(token);
   if(error||!user)return json({error:'Ugyldig innlogging'},401);
   const {code}=await req.json();if(typeof code!=='string'||!/^\d{6}$/.test(code))return json({error:'Stadfestingskoden må vera seks siffer'},400);
   const {data:p}=await client.from('staff_profiles').select('id,confirmed,disabled,confirm_hash,confirm_salt,confirm_attempts,locked_until').eq('id',user.id).single();
   if(!p||p.disabled)return json({error:'Kontoen er ikkje aktiv'},403);
   if(p.confirmed)return json({ok:true});
   if(p.locked_until&&new Date(p.locked_until).getTime()>Date.now())return json({error:'For mange forsøk. Prøv seinare eller be om ny kode.'},429);
   if(!p.confirm_hash||!p.confirm_salt)return json({error:'Administrator må laga ein ny kode'},409);
   const candidate=await digest(code,p.confirm_salt);
   if(!equal(candidate,p.confirm_hash)){
     const attempts=(p.confirm_attempts||0)+1;
     await client.from('staff_profiles').update({confirm_attempts:attempts,locked_until:attempts>=5?new Date(Date.now()+10*60*1000).toISOString():null}).eq('id',user.id).eq('confirmed',false);
     return json({error:attempts>=5?'For mange forsøk. Vent 10 minutt.':'Feil stadfestingskode'},400);
   }
   const {error:ue}=await client.from('staff_profiles').update({confirmed:true,confirm_hash:null,confirm_salt:null,confirm_attempts:0,locked_until:null}).eq('id',user.id);
   if(ue)return json({error:'Stadfestinga kunne ikkje lagrast'},500);
   return json({ok:true});
 }catch(e){return json({error:'Tenestefeil. Kontroller Supabase-loggen.'},500)}
});
