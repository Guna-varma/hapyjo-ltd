// Multi-session realtime authorization test: 8 real sessions subscribe like the app;
// mutations are performed by specific roles; we record WHO receives each event.
import { loginAll, logoutAll, watch, sleep, received, log } from './lib.mjs';

const S = await loginAll();
const W = {};
for (const [k, s] of Object.entries(S)) W[k] = watch(s, k);
const statuses = await Promise.all(Object.values(W).map(w => w.status));
log('subscriptions', statuses.join(','));
log('extra subscriptions', (await Promise.all(Object.values(W).map(w => w.extraStatus))).join(','));
await sleep(6000); // let Realtime register all 8x2 channel subscriptions before mutating

const who = (table, id, e) => Object.keys(W).filter(k => received(W[k], table, id, e).length > 0).join(',') || '(nobody)';
const dup = (table, id, e) => Object.keys(W).filter(k => received(W[k], table, id, e).length > 1).join(',') || '';
const stamp = Date.now();
const ids = { n1: `n_TEST-E2E_${stamp}_a`, n2: `n_TEST-E2E_${stamp}_b`, n3: `n_TEST-E2E_${stamp}_c`, exp: `TEST-E2E-exp-${stamp}` };

// 1. personal notification for the test truck driver (inserted by AS, like setDriverVehicleAssignment does)
let t0 = Date.now();
let r = await S.as.c.from('notifications').insert({ id: ids.n1, target_role: 'driver_truck', target_user_id: S.dt.uid, title: 'TEST-E2E rt', body: 'personal to dt', read: false, created_at: new Date().toISOString() });
log('insert personal notif -> dt', r.error?.message ?? 'ok');
await sleep(2500);
log('  received by', who('notifications', ids.n1, 'INSERT') + `  (${W.dt.events.find(x=>x.id===ids.n1)? W.dt.events.find(x=>x.id===ids.n1).at - t0 : '-'}ms to dt)`);

// 2. personal notification for the MACHINE driver — dt (and everyone else but owner/admin) must NOT get it
r = await S.as.c.from('notifications').insert({ id: ids.n2, target_role: 'driver_machine', target_user_id: S.dm.uid, title: 'TEST-E2E rt', body: 'personal to machine driver', read: false, created_at: new Date().toISOString() });
log('insert personal notif -> other driver', r.error?.message ?? 'ok');
await sleep(2500);
log('  received by', who('notifications', ids.n2, 'INSERT'));

// 3. role-wide notification for head_supervisor
r = await S.as.c.from('notifications').insert({ id: ids.n3, target_role: 'head_supervisor', title: 'TEST-E2E rt', body: 'role-wide hs', read: false, created_at: new Date().toISOString() });
log('insert role notif -> head_supervisor', r.error?.message ?? 'ok');
await sleep(2500);
log('  received by', who('notifications', ids.n3, 'INSERT'));

// 4. owner updates a TEST-E2E site (no-op value change keeps data identical but emits an UPDATE)
const { data: siteRow } = await S.owner.c.from('sites').select('id,contract_details').eq('id', 'e2e_site_alpha').single();
t0 = Date.now();
r = await S.owner.c.from('sites').update({ contract_details: siteRow.contract_details }).eq('id', 'e2e_site_alpha');
log('owner UPDATE e2e_site_alpha', r.error?.message ?? 'ok');
await sleep(2500);
log('  received by', who('sites', 'e2e_site_alpha', 'UPDATE') + '  dup:' + dup('sites', 'e2e_site_alpha', 'UPDATE'));

// 5. owner updates demo-site-1 (test users are NOT assigned) — cross-site isolation
const { data: demoRow } = await S.owner.c.from('sites').select('id,contract_details').eq('id', 'demo-site-1').single();
r = await S.owner.c.from('sites').update({ contract_details: demoRow.contract_details }).eq('id', 'demo-site-1');
log('owner UPDATE demo-site-1 (unassigned site)', r.error?.message ?? 'ok');
await sleep(2500);
log('  received by', who('sites', 'demo-site-1', 'UPDATE'));

// 6. driver updates own assigned trip notes (TEST-E2E trip)
const { data: myTrip } = await S.dt.c.from('assigned_trips').select('id,notes,status').eq('driver_id', S.dt.uid).limit(1).single();
r = await S.dt.c.from('assigned_trips').update({ notes: myTrip.notes }).eq('id', myTrip.id);
log(`driver UPDATE own assigned_trip ${myTrip.id}`, r.error?.message ?? 'ok');
await sleep(2500);
log('  received by', who('assigned_trips', myTrip.id, 'UPDATE'));

// 7. AS inserts + deletes an expense on e2e_site_alpha
r = await S.as.c.from('expenses').insert({ id: ids.exp, site_id: 'e2e_site_alpha', amount_rwf: 1000, description: 'TEST-E2E rt expense', date: '2026-09-12', type: 'general', expense_category: 'other', created_at: new Date().toISOString() });
log('AS INSERT expense e2e_site_alpha', r.error?.message ?? 'ok');
await sleep(2500);
log('  received by', who('expenses', ids.exp, 'INSERT'));
r = await S.as.c.from('expenses').delete().eq('id', ids.exp);
log('AS DELETE expense', r.error?.message ?? 'ok');
await sleep(2500);
log('  DELETE received by', who('expenses', ids.exp, 'DELETE'));
// sites.spent was incremented by on_expense_insert trigger — restore (delete does not decrement)
const { data: after } = await S.owner.c.from('sites').select('spent').eq('id','e2e_site_alpha').single();
log('  e2e_site_alpha.spent after insert+delete', after.spent);

// cleanup notifications (delete policy: only the targeted role may delete its rows)
for (const [id, sess] of [[ids.n1, S.dt], [ids.n2, S.dm], [ids.n3, S.hs]]) { const d = await sess.c.from('notifications').delete().eq('id', id); if (d.error) log('cleanup error', d.error.message); }
const { count } = await S.owner.c.from('notifications').select('*',{count:'exact',head:true}).like('id', `n_TEST-E2E_${stamp}%`);
log('cleanup notifications remaining', count);

// total event counts per session (sanity: no runaway)
log('event totals', Object.entries(W).map(([k,w])=>k+':'+w.events.length).join(' '));
log('system msgs (hs)', W.hs.sys.join(' || '));
await logoutAll(S);
