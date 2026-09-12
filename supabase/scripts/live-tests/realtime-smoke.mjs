// Minimal realtime smoke test: one real session subscribes to postgres_changes on
// notifications, inserts a notification for itself, and reports whether/when the
// change event arrives. Cleans up the row afterwards.
import { login, sleep, log } from './lib.mjs';

const email = process.argv[2] || 'test.headsupervisor@hapyjo.com';
const s = await login(email);
log('session', s.uid);
const events = [];
const ch = s.c.channel('smoke-' + Date.now());
ch.on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (p) => events.push({ e: p.eventType, id: p.new?.id ?? p.old?.id, at: Date.now() }));
ch.on('system', {}, (p) => log('system', JSON.stringify(p).slice(0, 300)));
const status = await new Promise((res) => ch.subscribe((st, err) => { log('status', st + (err ? ' ' + err.message : '')); if (st !== 'SUBSCRIBED' || true) res(st); }));
await sleep(1500);
const { data: prof } = await s.c.rpc('get_my_profile').single();
const id = 'n_TEST-E2E_smoke_' + Date.now();
const t0 = Date.now();
const r = await s.c.from('notifications').insert({ id, target_role: prof.role, target_user_id: s.uid, title: 'TEST-E2E smoke', body: 'rt smoke', read: false, created_at: new Date().toISOString() });
log('insert', r.error?.message ?? 'ok');
await sleep(5000);
log('events', JSON.stringify(events) + (events[0] ? ` latency=${events[0].at - t0}ms` : ''));
const d = await s.c.from('notifications').delete().eq('id', id);
log('cleanup', d.error?.message ?? 'ok');
await s.c.removeAllChannels();
await s.c.auth.signOut({ scope: 'local' });
