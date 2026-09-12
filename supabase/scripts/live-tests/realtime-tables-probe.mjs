// Which table sets break delivery? One session, channel with a given table list.
import { login, sleep, log, TABLES } from './lib.mjs';
const s = await login('test.headsupervisor@hapyjo.com');
const { data: prof } = await s.c.rpc('get_my_profile').single();
async function trial(name, tables){
  const events=[]; const ch=s.c.channel('probe-'+name+'-'+Date.now());
  for(const t of tables) ch.on('postgres_changes',{event:'*',schema:'public',table:t},(p)=>events.push(p.table+':'+p.eventType));
  let sysMsg=''; ch.on('system',{},(p)=>{sysMsg+=JSON.stringify(p).slice(0,200)+' | ';});
  const st=await new Promise(r=>ch.subscribe((x)=>{ if(x==='SUBSCRIBED'||x==='CHANNEL_ERROR'||x==='TIMED_OUT') r(x);}));
  await sleep(1500);
  const id='n_TEST-E2E_probe_'+Date.now();
  await s.c.from('notifications').insert({id,target_role:prof.role,target_user_id:s.uid,title:'TEST-E2E probe',body:'x',read:false,created_at:new Date().toISOString()});
  await sleep(4000);
  await s.c.from('notifications').delete().eq('id',id);
  log(name+' ['+tables.length+' tables] '+st, 'events='+JSON.stringify(events)+' sys='+sysMsg);
  await s.c.removeChannel(ch);
}
await trial('notif-only', ['notifications']);
await trial('published-only', TABLES.filter(t=>!['work_photos','site_tasks'].includes(t)));
await trial('all19', TABLES);
await s.c.auth.signOut({scope:'local'});
