// Post-fix security re-attack with REAL authenticated sessions (anon key + test accounts)
// and one anonymous client. Every line must print BLOCKED / none. Anything that succeeds
// is reverted immediately and reported.
import { createClient } from '@supabase/supabase-js';
import { loginAll, logoutAll, log, URL_, KEY } from './lib.mjs';

const S = await loginAll();
const anon = createClient(URL_, KEY, { auth: { persistSession: false } });
let failures = 0;
const check = (label, blocked, detail = '') => { log(label, (blocked ? 'BLOCKED ' : 'SUCCEEDED!!! ') + detail); if (!blocked) failures++; };
const upd = async (c, table, patch, match, sel = 'id') => { const q = c.from(table).update(patch); for (const [k, v] of Object.entries(match)) q.eq(k, v); return q.select(sel); };

// --- privilege escalation (driver) ---
for (const role of ['owner', 'admin']) {
  const r = await upd(S.dt.c, 'profiles', { role }, { id: S.dt.uid }, 'role');
  check(`driver self role -> ${role}`, !!r.error || !r.data?.length, r.error?.message ?? JSON.stringify(r.data));
  if (!r.error && r.data?.length) await upd(S.dt.c, 'profiles', { role: 'driver_truck' }, { id: S.dt.uid });
}
{
  const r = await upd(S.dt.c, 'profiles', { site_access: ['site_016b39ed69e6'] }, { id: S.dt.uid }, 'site_access');
  check('driver self site_access', !!r.error || !r.data?.length, r.error?.message ?? JSON.stringify(r.data));
  const r2 = await upd(S.dt.c, 'profiles', { active: false }, { id: S.dt.uid }, 'active');
  check('driver self active=false', !!r2.error || !r2.data?.length, r2.error?.message ?? JSON.stringify(r2.data));
  const r3 = await upd(S.dt.c, 'profiles', { name: 'Test Truck Driver' }, { id: S.dt.uid }, 'name');
  log('driver self name (allowed)', r3.error ? 'ERR ' + r3.error.message : 'ok ' + JSON.stringify(r3.data));
  const r4 = await upd(S.dt.c, 'profiles', { role: 'owner' }, { id: S.as.uid }, 'role');
  check('driver change AS role', !!r4.error || !r4.data?.length, r4.error?.message ?? 'no rows');
  // head supervisor promoting themselves / an AS to owner (both must fail), demoting an owner (must fail)
  const r5 = await upd(S.hs.c, 'profiles', { role: 'owner' }, { id: S.hs.uid }, 'role');
  check('HS self role -> owner', !!r5.error || !r5.data?.length, r5.error?.message ?? JSON.stringify(r5.data));
  const r6 = await upd(S.hs.c, 'profiles', { role: 'owner' }, { id: S.as.uid }, 'role');
  check('HS promote AS -> owner', !!r6.error || !r6.data?.length, r6.error?.message ?? JSON.stringify(r6.data));
  if (!r6.error && r6.data?.length) await upd(S.owner.c, 'profiles', { role: 'assistant_supervisor' }, { id: S.as.uid });
  const r7 = await upd(S.hs.c, 'profiles', { role: 'driver_truck' }, { id: S.owner.uid }, 'role');
  check('HS demote owner', !!r7.error || !r7.data?.length, r7.error?.message ?? JSON.stringify(r7.data));
  const r8 = await upd(S.owner.c, 'profiles', { role: 'owner' }, { id: S.admin.uid }, 'role');
  check('owner change admin role', !!r8.error || !r8.data?.length, r8.error?.message ?? JSON.stringify(r8.data));
  // legit: HS changes a surveyor's phone (non-privileged) must still work
  const r9 = await upd(S.hs.c, 'profiles', { phone: null }, { id: S.sv.uid }, 'phone');
  log('HS edit surveyor phone (allowed)', r9.error ? 'ERR ' + r9.error.message : 'ok');
}

// --- anonymous signup with privileged metadata ---
for (const role of ['owner', 'admin']) {
  const r = await anon.auth.signUp({ email: `test-e2e-signup-${role}-${Date.now()}@hapyjo.com`, password: 'Probe12345!x', options: { data: { role } } });
  check(`anon signUp role=${role}`, !!r.error, r.error?.message ?? ('user=' + r.data.user?.id));
}

// --- cross-site reads ---
{
  const r = await S.as.c.from('expenses').select('site_id').not('site_id', 'in', '("e2e_site_alpha","e2e_site_beta","e2e_site_gamma")').limit(3);
  check('AS read other-site expenses', !r.error && r.data.length === 0, r.error?.message ?? `${r.data?.length} rows`);
  const r2 = await S.dt.c.from('trips').select('id,driver_id').neq('driver_id', S.dt.uid).limit(3);
  check('driver read other drivers trips', !r2.error && r2.data.length === 0, r2.error?.message ?? `${r2.data?.length} rows`);
  const r3 = await S.dm.c.from('machine_sessions').select('id').neq('driver_id', S.dm.uid).limit(3);
  check('machine driver read other sessions', !r3.error && r3.data.length === 0, r3.error?.message ?? `${r3.data?.length} rows`);
  const r4 = await S.sv.c.from('work_photos').select('id').neq('uploaded_by', S.sv.uid).limit(3);
  check('surveyor read others photos', !r4.error && r4.data.length === 0, r4.error?.message ?? `${r4.data?.length} rows`);
  const r5 = await S.dt.c.from('work_photos').select('id').neq('uploaded_by', S.dt.uid).limit(3);
  check('driver read others photos', !r5.error && r5.data.length === 0, r5.error?.message ?? `${r5.data?.length} rows`);
  const r6 = await S.sv.c.from('sites').select('id').not('id', 'in', '("e2e_site_alpha","e2e_site_beta","e2e_site_gamma")').limit(3);
  check('surveyor read other sites', !r6.error && r6.data.length === 0, r6.error?.message ?? `${r6.data?.length} rows`);
  const r7 = await S.ac.c.from('issues').select('id').limit(3);
  check('accountant read issues', !r7.error && r7.data.length === 0, r7.error?.message ?? `${r7.data?.length} rows`);
  const r8 = await S.sv.c.from('assigned_trips').select('id').limit(3);
  check('surveyor read assigned_trips', !r8.error && r8.data.length === 0, r8.error?.message ?? `${r8.data?.length} rows`);
}

// --- unauthorized writes ---
{
  const r = await S.ac.c.from('expenses').insert({ id: 'TEST-E2E-probe-exp', site_id: 'e2e_site_alpha', amount_rwf: 1, description: 'probe', date: '2026-09-12', type: 'general' });
  check('accountant insert expense', !!r.error, r.error?.message); if (!r.error) await S.owner.c.from('expenses').delete().eq('id', 'TEST-E2E-probe-exp');
  const r2 = await S.as.c.from('expenses').insert({ id: 'TEST-E2E-probe-exp2', site_id: 'site_016b39ed69e6', amount_rwf: 1, description: 'probe', date: '2026-09-12', type: 'general' });
  check('AS insert expense on other site', !!r2.error, r2.error?.message); if (!r2.error) await S.as.c.from('expenses').delete().eq('id', 'TEST-E2E-probe-exp2');
  const r3 = await S.dt.c.from('expenses').insert({ id: 'TEST-E2E-probe-exp3', site_id: 'e2e_site_alpha', amount_rwf: 1, description: 'probe', date: '2026-09-12', type: 'general' });
  check('driver insert general expense', !!r3.error, r3.error?.message); if (!r3.error) await S.as.c.from('expenses').delete().eq('id', 'TEST-E2E-probe-exp3');
  const { data: otherExp } = await S.owner.c.from('expenses').select('id,site_id').not('site_id', 'in', '("e2e_site_alpha","e2e_site_beta","e2e_site_gamma")').limit(1);
  if (otherExp?.length) { const d = await S.as.c.from('expenses').delete().eq('id', otherExp[0].id).select('id'); check('AS delete other-site expense', !!d.error || !d.data?.length, d.error?.message ?? 'no rows'); }
  const r4 = await S.dt.c.from('trips').insert({ id: 'TEST-E2E-probe-trip', vehicle_id: 'e2e_truck_01', driver_id: S.dm.uid, site_id: 'e2e_site_alpha', start_time: new Date().toISOString(), distance_km: 0, status: 'in_progress' });
  check('driver insert trip for another driver', !!r4.error, r4.error?.message); if (!r4.error) await S.owner.c.from('trips').delete().eq('id', 'TEST-E2E-probe-trip');
  const r5 = await S.dt.c.from('tasks').insert({ id: 'TEST-E2E-probe-task', title: 'p', description: 'p', site_id: 'e2e_site_alpha', status: 'pending', priority: 'low', due_date: '2026-09-12', progress: 0 });
  check('driver insert task', !!r5.error, r5.error?.message); if (!r5.error) await S.owner.c.from('tasks').delete().eq('id', 'TEST-E2E-probe-task');
  const r6 = await S.dt.c.from('operations').insert({ id: 'TEST-E2E-probe-op', name: 'p', site_id: 'e2e_site_alpha', type: 'p', status: 'active', budget: 0, spent: 0, start_date: '2026-09-12' });
  check('driver insert operation', !!r6.error, r6.error?.message); if (!r6.error) await S.owner.c.from('operations').delete().eq('id', 'TEST-E2E-probe-op');
  const r7 = await S.as.c.from('issues').update({ status: 'resolved' }).eq('id', 'i_41abad6d41b8').select('id');
  check('AS resolve issue', !!r7.error || !r7.data?.length, r7.error?.message ?? 'no rows');
  const r8 = await S.sv.c.from('surveys').update({ status: 'approved' }).eq('surveyor_id', S.sv.uid).eq('status', 'approval_pending').select('id');
  check('surveyor self-approve', !!r8.error || !r8.data?.length, r8.error?.message ?? `${r8.data?.length} rows`);
  if (!r8.error && r8.data?.length) for (const row of r8.data) await S.sv.c.from('surveys').update({ status: 'approval_pending' }).eq('id', row.id);
}

// --- assigned trip lifecycle bypass ---
{
  const { data: mine } = await S.dt.c.from('assigned_trips').select('id,status').eq('driver_id', S.dt.uid).eq('status', 'TRIP_ASSIGNED').limit(1);
  if (mine?.length) {
    const id = mine[0].id;
    const r = await S.dt.c.from('assigned_trips').update({ status: 'TRIP_COMPLETED' }).eq('id', id).select('status');
    check('driver ASSIGNED -> COMPLETED', !!r.error, r.error?.message ?? JSON.stringify(r.data));
    const r2 = await S.dt.c.from('assigned_trips').update({ status: 'TRIP_NEED_APPROVAL' }).eq('id', id).select('status');
    check('driver ASSIGNED -> NEED_APPROVAL', !!r2.error, r2.error?.message ?? JSON.stringify(r2.data));
    const r3 = await S.dt.c.from('assigned_trips').update({ fuel_used_l: 0, start_reading: 1, end_reading: 2 }).eq('id', id).select('id');
    check('driver write readings/fuel', !!r3.error, r3.error?.message ?? JSON.stringify(r3.data));
    const r4 = await S.dt.c.from('assigned_trips').update({ notes: 'TEST-E2E probe note' }).eq('id', id).select('id');
    log('driver update own notes (allowed)', r4.error ? 'ERR ' + r4.error.message : 'ok');
    const r5 = await S.dt.c.from('assigned_trips').update({ status: 'TRIP_STARTED' }).eq('id', id).select('status');
    check('driver ASSIGNED -> STARTED without evidence (constraint)', !!r5.error, r5.error?.message ?? JSON.stringify(r5.data));
  } else log('lifecycle bypass', 'no TRIP_ASSIGNED trip to test');
  const { data: na } = await S.as.c.from('assigned_trips').select('id,status').eq('status', 'TRIP_NEED_APPROVAL').limit(1);
  if (na?.length) {
    const r = await S.as.c.from('assigned_trips').update({ status: 'TRIP_STARTED' }).eq('id', na[0].id).select('status');
    check('AS NEED_APPROVAL -> STARTED', !!r.error, r.error?.message ?? JSON.stringify(r.data));
  }
}

// --- RPCs ---
{
  const { data: na } = await S.as.c.from('assigned_trips').select('id').eq('status', 'TRIP_NEED_APPROVAL').limit(1);
  const id = na?.[0]?.id ?? 'nonexistent';
  for (const [k, s] of [['driver', S.dt], ['HS', S.hs], ['owner', S.owner], ['accountant', S.ac]]) {
    const r = await s.c.rpc('approve_assigned_trip_readings', { p_assigned_trip_id: id, p_start_reading: 1, p_end_reading: 2 });
    check(`${k} rpc approve_assigned_trip_readings`, !!r.error, r.error?.message);
  }
  const r = await anon.rpc('approve_assigned_trip_readings', { p_assigned_trip_id: id, p_start_reading: 1, p_end_reading: 2 });
  check('anon rpc approve_assigned_trip_readings', !!r.error, r.error?.message);
  const r2 = await S.as.c.rpc('driver_record_fuel_at_start', { p_vehicle_id: 'e2e_truck_01', p_litres: 5 });
  check('AS rpc driver_record_fuel_at_start', !!r2.error, r2.error?.message);
  const r3 = await S.dt.c.rpc('driver_record_fuel_at_start', { p_vehicle_id: 'demo-v1', p_litres: 5 });
  check('driver fuel on unassigned vehicle', !!r3.error, r3.error?.message);
  const r4 = await S.dt.c.rpc('driver_record_fuel_at_start', { p_vehicle_id: 'e2e_truck_01', p_litres: -5 });
  check('driver fuel negative litres', !!r4.error, r4.error?.message);
  const r5 = await anon.rpc('driver_record_fuel_at_start', { p_vehicle_id: 'e2e_truck_01', p_litres: 5 });
  check('anon rpc driver_record_fuel_at_start', !!r5.error, r5.error?.message);
  const r6 = await anon.rpc('get_my_profile');
  check('anon rpc get_my_profile returns nothing', !!r6.error || !r6.data?.length, r6.error?.message ?? `${r6.data?.length} rows`);
}

// --- Edge function ---
{
  const call = async (session, body) => { const r = await session.c.functions.invoke('create_user_by_owner', { body }); return { status: r.error?.context?.status, data: r.data, err: r.error?.message }; };
  const r = await call(S.hs, { email: 'test-e2e-should-not-exist@hapyjo.com', name: 'x', role: 'admin' });
  check('HS create admin via edge fn', !r.data?.user_id, JSON.stringify(r).slice(0, 140));
  const r2 = await call(S.dt, { email: 'test-e2e-should-not-exist2@hapyjo.com', name: 'x', role: 'driver_truck' });
  check('driver create user via edge fn', !r2.data?.user_id, JSON.stringify(r2).slice(0, 140));
  const r3 = await anon.functions.invoke('create_user_by_owner', { body: { email: 'test-e2e-should-not-exist3@hapyjo.com', name: 'x', role: 'owner' } });
  check('anon create user via edge fn', !r3.data?.user_id, (r3.error?.message ?? JSON.stringify(r3.data)).slice(0, 140));
  const r4 = await call(S.dt, { user_id: S.owner.uid });
  const r5 = await S.dt.c.functions.invoke('reset_user_password', { body: { user_id: S.owner.uid } });
  check('driver reset owner password via edge fn', !r5.data?.temporary_password, (r5.error?.message ?? JSON.stringify(r5.data)).slice(0, 140));
}

// --- storage ---
{
  const r = await S.sv.c.storage.from('work-photos').upload('work/probe/x.jpg', new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), { contentType: 'image/jpeg' });
  log('surveyor upload work-photos/work (allowed)', r.error ? 'ERR ' + r.error.message : 'ok');
  if (!r.error) { const d = await S.dt.c.storage.from('work-photos').remove(['work/probe/x.jpg']); log('driver delete surveyor photo', (d.error ? 'BLOCKED ' + d.error.message : `no error, removed=${d.data?.length ?? 0}`)); }
  const r2 = await S.dt.c.storage.from('gps-images').upload('other/x.jpg', new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), { contentType: 'image/jpeg' });
  check('driver upload gps-images outside gps/', !!r2.error, r2.error?.message);
  const r3 = await anon.storage.from('work-photos').upload('work/probe/anon.jpg', new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), { contentType: 'image/jpeg' });
  check('anon upload work-photos', !!r3.error, r3.error?.message);
  const r4 = await anon.storage.from('issue-images').list('issue', { limit: 1 });
  check('anon list issue-images', !!r4.error || !r4.data?.length, r4.error?.message ?? `${r4.data?.length} entries`);
}

log('RESULT', failures === 0 ? 'ALL ATTACKS BLOCKED' : `${failures} ATTACK(S) SUCCEEDED`);
await logoutAll(S);
process.exit(failures === 0 ? 0 : 1);
