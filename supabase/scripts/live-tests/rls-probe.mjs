// Adversarial RLS probe using REAL authenticated sessions (anon key + test accounts).
// Only attempts writes that would be security failures if they succeed,
// and reverts anything that unexpectedly succeeds.
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = Object.fromEntries(fs.readFileSync(new URL('../../../.env', import.meta.url),'utf8').split(/\r?\n/).filter(l=>l.includes('=')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim()]}));
const URL_=env.VITE_SUPABASE_URL, KEY=env.VITE_SUPABASE_ANON_KEY;
const PW = process.env.TEST_PW;
const roles = {
  admin:'test.admin@hapyjo.com', hs:'test.headsupervisor@hapyjo.com', as:'test.assistantsupervisor@hapyjo.com',
  dt:'test.drivertruck@hapyjo.com', dm:'test.drivermachine@hapyjo.com', sv:'test.surveyor@hapyjo.com', ac:'test.accountant@hapyjo.com',
};
async function login(email){ const c=createClient(URL_,KEY,{auth:{persistSession:false,autoRefreshToken:false}}); const {data,error}=await c.auth.signInWithPassword({email,password:PW}); if(error) throw new Error(email+': '+error.message); return {c,uid:data.user.id}; }
const log=(k,v)=>{ console.log(k.padEnd(60), v);};
const sessions={};
for (const [k,e] of Object.entries(roles)) { try { sessions[k]=await login(e); } catch(err){ log('LOGIN '+k, 'FAIL '+err.message);} }
log('logins', Object.keys(sessions).join(','));

// 1. Row visibility per role
for (const [k,{c}] of Object.entries(sessions)) {
  const counts={};
  for (const t of ['profiles','sites','vehicles','expenses','trips','machine_sessions','surveys','issues','site_assignments','driver_vehicle_assignments','tasks','operations','reports','notifications','site_budget_allocations','work_photos','site_tasks','assigned_trips','gps_photos','push_tokens']) {
    const {count,error}=await c.from(t).select('*',{count:'exact',head:true});
    counts[t]= error? 'ERR:'+error.code : count;
  }
  log('VISIBILITY '+k, JSON.stringify(counts));
}

// 2. Self role escalation (driver -> owner) — revert immediately if it succeeds
{
  const {c,uid}=sessions.dt;
  const {data,error}=await c.from('profiles').update({role:'owner'}).eq('id',uid).select('role');
  log('ESCALATE dt role->owner', error? 'BLOCKED '+error.message : 'SUCCEEDED!!! '+JSON.stringify(data));
  if(!error && data?.length){ const r=await c.from('profiles').update({role:'driver_truck'}).eq('id',uid).select('role'); log('  revert', JSON.stringify(r.data)||r.error?.message); }
  const r2=await c.from('profiles').update({active:false}).eq('id',uid).select('active');
  log('SELF active->false dt', r2.error? 'BLOCKED '+r2.error.message : 'SUCCEEDED '+JSON.stringify(r2.data));
  if(!r2.error && r2.data?.length){ await c.from('profiles').update({active:true}).eq('id',uid); }
  const r3=await c.from('profiles').update({site_access:['e2e_site_alpha','site_016b39ed69e6']}).eq('id',uid).select('site_access');
  log('SELF site_access change dt', r3.error? 'BLOCKED '+r3.error.message : 'SUCCEEDED '+JSON.stringify(r3.data));
  if(!r3.error && r3.data?.length){ await c.from('profiles').update({site_access:['e2e_site_alpha','e2e_site_beta','e2e_site_gamma']}).eq('id',uid); }
}
// 3. Cross-user writes
{
  const {c}=sessions.dt; const asId=sessions.as.uid;
  const r=await c.from('profiles').update({name:'HACKED'}).eq('id',asId).select('name');
  log('dt update other profile', r.error? 'BLOCKED '+r.error.message : (r.data?.length? 'SUCCEEDED!!!':'no-op (0 rows)'));
  const s=sessions.sv.c; const {data:mine}=await s.from('surveys').select('id,status').eq('surveyor_id',sessions.sv.uid).eq('status','pending').limit(1);
  if(mine?.length){ const r2=await s.from('surveys').update({status:'approved'}).eq('id',mine[0].id).select('status'); log('surveyor self-approve survey', r2.error?'BLOCKED '+r2.error.message:(r2.data?.length?'SUCCEEDED!!! '+mine[0].id:'no-op')); if(!r2.error&&r2.data?.length){ await s.from('surveys').update({status:'pending'}).eq('id',mine[0].id);} } else log('surveyor self-approve survey','no pending survey to test');
  const a=sessions.ac.c; const r3=await a.from('expenses').insert({id:'TEST-E2E-probe-exp',site_id:'e2e_site_alpha',amount_rwf:1,description:'probe',date:'2026-09-12',type:'general'}).select('id');
  log('accountant insert expense', r3.error?'BLOCKED '+r3.error.message:'SUCCEEDED!!!'); if(!r3.error){ await a.from('expenses').delete().eq('id','TEST-E2E-probe-exp'); }
  const r4=await c.from('sites').insert({id:'TEST-E2E-probe-site',name:'probe',location:'x',status:'active',start_date:'2026-09-12',budget:0,spent:0,progress:0}).select('id');
  log('driver insert site', r4.error?'BLOCKED '+r4.error.message:'SUCCEEDED!!!'); if(!r4.error){ await c.from('sites').delete().eq('id','TEST-E2E-probe-site'); }
  const {data:otherAt}=await sessions.admin.c.from('assigned_trips').select('id,driver_id,status').neq('driver_id',sessions.dt.uid).limit(1);
  if(otherAt?.length){ const r5=await c.from('assigned_trips').update({notes:'probe'}).eq('id',otherAt[0].id).select('id'); log('driver update other driver assigned_trip', r5.error?'BLOCKED '+r5.error.message:(r5.data?.length?'SUCCEEDED!!!':'no-op (0 rows, RLS filtered)')); }
  const r6=await c.from('tasks').insert({id:'TEST-E2E-probe-task',title:'probe',description:'p',site_id:'e2e_site_alpha',status:'not_started',priority:'low',due_date:'2026-09-12',progress:0}).select('id');
  log('driver insert task (any site)', r6.error?'BLOCKED '+r6.error.message:'SUCCEEDED (policy allows all authenticated)'); if(!r6.error){ await c.from('tasks').delete().eq('id','TEST-E2E-probe-task'); }
  const r7=await c.from('notifications').select('target_role').neq('target_role','driver_truck').limit(5);
  log('driver read other-role notifications', r7.error?'ERR '+r7.error.message:(r7.data.length? 'LEAK!!! '+JSON.stringify(r7.data):'none (ok)'));
  const r7b=await c.from('notifications').select('target_user_id').eq('target_role','driver_truck').not('target_user_id','is',null).neq('target_user_id',sessions.dt.uid).limit(5);
  log('driver read other-driver personal notifs', r7b.error?'ERR '+r7b.error.message:(r7b.data.length? 'LEAK!!! '+JSON.stringify(r7b.data):'none (ok)'));
  const r8=await sessions.as.c.from('expenses').select('site_id').not('site_id','in','("e2e_site_alpha","e2e_site_beta","e2e_site_gamma")').limit(5);
  log('AS read other-site expenses', r8.error?'ERR '+r8.error.message:(r8.data.length?'LEAK!!! '+JSON.stringify(r8.data):'none (ok)'));
  const r9=await sessions.as.c.from('vehicles').update({fuel_balance_litre:999}).eq('id','demo-v1').select('id');
  log('AS update other-site vehicle', r9.error?'BLOCKED '+r9.error.message:(r9.data?.length?'SUCCEEDED!!!':'no-op (RLS filtered)')); if(!r9.error&&r9.data?.length){ await sessions.as.c.from('vehicles').update({fuel_balance_litre:50}).eq('id','demo-v1'); }
  const r10=await c.rpc('approve_assigned_trip_readings',{p_assigned_trip_id:'nonexistent',p_start_reading:1,p_end_reading:2});
  log('driver rpc approve_assigned_trip_readings', r10.error?'BLOCKED '+r10.error.message:'SUCCEEDED!!!');
  const r10b=await sessions.hs.c.rpc('approve_assigned_trip_readings',{p_assigned_trip_id:'nonexistent',p_start_reading:1,p_end_reading:2});
  log('HS rpc approve_assigned_trip_readings', r10b.error?'BLOCKED '+r10b.error.message:'SUCCEEDED!!!');
  const anon=createClient(URL_,KEY,{auth:{persistSession:false}});
  const r11=await anon.auth.signUp({email:'test-e2e-signup-probe-'+Date.now()+'@hapyjo.com',password:'Probe12345!x',options:{data:{role:'owner'}}});
  log('ANON SIGNUP (metadata role=owner)', r11.error?'BLOCKED '+r11.error.message:('SUCCEEDED!!! user='+r11.data.user?.id+' session='+!!r11.data.session+' identities='+(r11.data.user?.identities?.length)));
  const r12=await c.storage.from('issue-images').upload('trip/probe/x.jpg', new Uint8Array([0xff,0xd8,0xff,0xd9]),{contentType:'image/jpeg'});
  log('driver upload issue-images/trip', r12.error?'BLOCKED '+r12.error.message:'ok'); if(!r12.error) { const d=await c.storage.from('issue-images').remove(['trip/probe/x.jpg']); log('  driver delete own upload', d.error?'BLOCKED '+d.error.message:'ok '+JSON.stringify(d.data)); }
  const r13=await c.storage.from('issue-images').upload('other/probe.jpg', new Uint8Array([0xff,0xd8,0xff,0xd9]),{contentType:'image/jpeg'});
  log('driver upload issue-images/other (should block)', r13.error?'BLOCKED '+r13.error.message:'SUCCEEDED!!!'); if(!r13.error) await c.storage.from('issue-images').remove(['other/probe.jpg']);
}
for (const s of Object.values(sessions)) await s.c.auth.signOut({ scope: 'local' });
