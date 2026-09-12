// A deactivated account must lose data access immediately, even with a still-valid JWT.
// Run with SUPABASE_SQL unavailable here: the deactivation itself is done by the owner
// through the app's own path (profiles.active via updateUser as owner), then restored.
import { login, log } from './lib.mjs';

const owner = await login('test.owner@hapyjo.com');
const acc = await login('test.accountant@hapyjo.com');
const count = async (t) => { const { count, error } = await acc.c.from(t).select('*', { count: 'exact', head: true }); return error ? 'ERR ' + error.message : count; };
log('accountant sites (active)', await count('sites'));
log('accountant expenses (active)', await count('expenses'));
let r = await owner.c.from('profiles').update({ active: false }).eq('id', acc.uid).select('active');
log('owner deactivates accountant', r.error ? 'ERR ' + r.error.message : JSON.stringify(r.data));
log('accountant sites (deactivated)', await count('sites'));
log('accountant expenses (deactivated)', await count('expenses'));
log('accountant site_assignments (deactivated)', await count('site_assignments'));
const { data: me } = await acc.c.rpc('get_my_profile').single();
log('accountant get_my_profile (deactivated)', me ? `active=${me.active}` : 'none');
r = await owner.c.from('profiles').update({ active: true }).eq('id', acc.uid).select('active');
log('owner reactivates accountant', r.error ? 'ERR ' + r.error.message : JSON.stringify(r.data));
log('accountant sites (reactivated)', await count('sites'));
await acc.c.auth.signOut({ scope: 'local' }); await owner.c.auth.signOut({ scope: 'local' });
