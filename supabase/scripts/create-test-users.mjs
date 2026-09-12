#!/usr/bin/env node
/**
 * Creates the dedicated Field Operations TEST accounts via the Supabase Auth Admin API.
 *
 * Run locally / server-side ONLY. Secrets are read from the environment at run time
 * and are never written to disk by this script:
 *
 *   SUPABASE_URL=https://dobfzbdwyimicxzcssiw.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=<service_role key from Dashboard > Project Settings > API> \
 *   TEST_USER_PASSWORD=<password for all 8 test accounts> \
 *   node supabase/scripts/create-test-users.mjs
 *
 * Behaviour:
 *   - never deletes or modifies existing users, profiles, or any other data;
 *   - skips any test email that already exists (reports it instead);
 *   - creates each missing user with email confirmed and user_metadata { role, name },
 *     which the existing public.handle_new_user trigger uses to build the profile;
 *   - verifies every account through Auth and public.profiles and prints a table.
 */

import { createClient } from '@supabase/supabase-js';

const TEST_USERS = [
  { email: 'test.owner@hapyjo.com', name: 'Test Owner', role: 'owner' },
  { email: 'test.admin@hapyjo.com', name: 'Test Admin', role: 'admin' },
  { email: 'test.headsupervisor@hapyjo.com', name: 'Test Head Supervisor', role: 'head_supervisor' },
  { email: 'test.assistantsupervisor@hapyjo.com', name: 'Test Assistant Supervisor', role: 'assistant_supervisor' },
  { email: 'test.drivertruck@hapyjo.com', name: 'Test Truck Driver', role: 'driver_truck' },
  { email: 'test.drivermachine@hapyjo.com', name: 'Test Machine Driver', role: 'driver_machine' },
  { email: 'test.surveyor@hapyjo.com', name: 'Test Surveyor', role: 'surveyor' },
  { email: 'test.accountant@hapyjo.com', name: 'Test Accountant', role: 'accountant' },
];

const PROFILE_FIELDS = ['id', 'name', 'email', 'role', 'active', 'site_access', 'created_at', 'updated_at'];

function requireEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value.trim();
}

const url = requireEnv('SUPABASE_URL');
const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
const password = requireEnv('TEST_USER_PASSWORD');

// Refuse to run with anything but a service-role key: the anon key cannot use the Admin API.
try {
  const payload = JSON.parse(Buffer.from(serviceKey.split('.')[1], 'base64url').toString('utf8'));
  if (payload.role !== 'service_role') {
    console.error(`SUPABASE_SERVICE_ROLE_KEY has role "${payload.role}", expected "service_role".`);
    process.exit(1);
  }
  if (payload.ref && !url.includes(payload.ref)) {
    console.error(`Key belongs to project "${payload.ref}" but SUPABASE_URL is ${url}.`);
    process.exit(1);
  }
} catch {
  // New-format (sb_secret_) keys are not JWTs; let the API validate them.
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

/** Lists every Auth user (paged) so existence checks are exact, not prefix matches. */
async function listAllUsers() {
  const users = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return users;
}

async function main() {
  const existing = await listAllUsers();
  const byEmail = new Map(existing.map((u) => [String(u.email).toLowerCase(), u]));

  const results = [];
  for (const spec of TEST_USERS) {
    const key = spec.email.toLowerCase();
    let user = byEmail.get(key);
    let status;

    if (user) {
      status = 'already existed (untouched)';
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email: spec.email,
        password,
        email_confirm: true,
        user_metadata: { role: spec.role, name: spec.name },
        // Required by public.handle_new_user(): marks the account as server-provisioned.
        app_metadata: { provisioned_by: 'hapyjo_admin' },
      });
      if (error) {
        results.push({ ...spec, uuid: '-', profile: 'CREATE FAILED: ' + error.message, status: 'failed' });
        continue;
      }
      user = data.user;
      status = 'created';
      // The profile is written by the on_auth_user_created trigger; give it a moment.
      await new Promise((r) => setTimeout(r, 400));
    }

    const { data: profile, error: pErr } = await admin
      .from('profiles')
      .select(PROFILE_FIELDS.join(','))
      .eq('id', user.id)
      .maybeSingle();

    let profileSummary;
    if (pErr) profileSummary = 'PROFILE READ ERROR: ' + pErr.message;
    else if (!profile) profileSummary = 'NO';
    else {
      const missing = PROFILE_FIELDS.filter((f) => profile[f] === undefined || profile[f] === null);
      const roleOk = profile.role === spec.role;
      profileSummary =
        (missing.length ? `YES (null: ${missing.join(',')})` : 'YES') +
        (roleOk ? '' : ` — ROLE MISMATCH: profile has "${profile.role}"`);
    }

    results.push({ ...spec, uuid: user.id, profile: profileSummary, status });
  }

  console.log('');
  console.log('Role                 | Name                      | Email                                  | Auth UUID                            | Profile Exists');
  console.log('---------------------|---------------------------|----------------------------------------|--------------------------------------|---------------');
  for (const r of results) {
    console.log(
      `${r.role.padEnd(20)} | ${r.name.padEnd(25)} | ${r.email.padEnd(38)} | ${String(r.uuid).padEnd(36)} | ${r.profile} [${r.status}]`,
    );
  }
  console.log('');
  const failed = results.filter((r) => r.status === 'failed');
  if (failed.length) {
    console.error(`${failed.length} account(s) failed to create.`);
    process.exit(2);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
