// Shared helpers for multi-session realtime tests against the REAL Supabase project,
// using the anon key + the dedicated test accounts (same as the browser app does).
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const env = Object.fromEntries(fs.readFileSync(new URL('../../../.env', import.meta.url),'utf8').split(/\r?\n/).filter(l=>l.includes('=')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim()]}));
export const URL_=env.VITE_SUPABASE_URL, KEY=env.VITE_SUPABASE_ANON_KEY;
export const PW = process.env.TEST_PW;
export const ROLES = {
  owner:'test.owner@hapyjo.com', admin:'test.admin@hapyjo.com', hs:'test.headsupervisor@hapyjo.com', as:'test.assistantsupervisor@hapyjo.com',
  dt:'test.drivertruck@hapyjo.com', dm:'test.drivermachine@hapyjo.com', sv:'test.surveyor@hapyjo.com', ac:'test.accountant@hapyjo.com',
};
export const CORE_TABLES = ['sites','vehicles','expenses','trips','machine_sessions','surveys','issues','site_assignments','driver_vehicle_assignments','assigned_trips','tasks','operations','reports','profiles','gps_photos','site_budget_allocations','notifications'];
export const EXTRA_TABLES = ['work_photos','site_tasks'];
export const TABLES = [...CORE_TABLES, ...EXTRA_TABLES];

export async function login(email){
  const c=createClient(URL_,KEY,{auth:{persistSession:false,autoRefreshToken:true}});
  const {data,error}=await c.auth.signInWithPassword({email,password:PW});
  if(error) throw new Error(email+': '+error.message);
  return {c,uid:data.user.id,email};
}

/** Subscribes exactly like the app store: one channel, postgres_changes on every table, event "*". */
/** Subscribes exactly like the app store: a core channel + an extra channel (work_photos, site_tasks), event "*". */
export function watch(session, name){
  const events=[]; const sys=[];
  const mk=(suffix, tables)=>{
    const ch=session.c.channel('rt-test-'+name+suffix+'-'+Math.random().toString(36).slice(2,6));
    for(const t of tables){ ch.on('postgres_changes',{event:'*',schema:'public',table:t},(p)=>{ events.push({t, e:p.eventType, id:p.new?.id ?? p.old?.id, at:Date.now(), row:p.new}); }); }
    ch.on('system',{},(p)=>sys.push(suffix+':'+p.status+':'+String(p.message).slice(0,80)));
    const status=new Promise((res)=>ch.subscribe((s)=>{ if(s==='SUBSCRIBED'||s==='CHANNEL_ERROR'||s==='TIMED_OUT') res(s); }));
    return {ch,status};
  };
  const core=mk('', CORE_TABLES); const extra=mk('-extra', EXTRA_TABLES);
  return {events, sys, ch:core.ch, extraCh:extra.ch, status:core.status, extraStatus:extra.status, name};
}
export const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
export function received(w, table, id, e){ return w.events.filter(x=>x.t===table && (id? x.id===id : true) && (e? x.e===e : true)); }
export async function loginAll(){ const s={}; for(const [k,e] of Object.entries(ROLES)) s[k]=await login(e); return s; }
export async function logoutAll(s){ for(const x of Object.values(s)) { try{ await x.c.removeAllChannels(); await x.c.auth.signOut({ scope: 'local' }); }catch{} } }
export const log=(k,v)=>console.log(String(k).padEnd(64), v);
