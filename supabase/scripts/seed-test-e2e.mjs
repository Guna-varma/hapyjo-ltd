#!/usr/bin/env node
/**
 * Seeds the isolated TEST-E2E-20260911 dataset for exercising every Field
 * Operations role and workflow, without touching existing business data.
 *
 * Run locally / server-side ONLY:
 *
 *   SUPABASE_URL=https://dobfzbdwyimicxzcssiw.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=<service_role key> \
 *   TEST_USER_PASSWORD=<password for test.owner> \
 *   node supabase/scripts/seed-test-e2e.mjs
 *
 * Guarantees:
 *   - every record it creates has an id starting with "e2e_" and a name /
 *     description containing TEST-E2E-20260911, so it is trivially identifiable;
 *   - idempotent: re-running upserts the same deterministic ids (no duplicates);
 *   - it never deletes anything and never writes to a row whose id is not "e2e_*"
 *     (the only exceptions are the 8 test profiles named below, and the
 *     site_tasks rows the database trigger auto-creates for the test sites);
 *   - storage uploads go under the "TEST-E2E-20260911/" prefix only.
 *
 * Known trigger side effects (production behaviour, not disabled here):
 *   - inserting a site auto-creates 9 weighted site_tasks (reshaped below);
 *   - inserting a vehicle mirrors it into umugwaneza.vehicles (reported);
 *   - expenses add to sites.spent and fuel litres to vehicles.fuel_balance_litre;
 *   - approved surveys add to sites.total_excavated_m3;
 *   - site_tasks BEFORE trigger sets updated_by = auth.uid() (null here).
 */

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const TAG = 'TEST-E2E-20260911';
const P = 'e2e_';

const USERS = {
  owner: '1e9ee7cf-f12f-4aa2-a578-52d3b6057d8e',
  admin: '00bcab13-a67f-4fcd-aa43-07fce727067e',
  head_supervisor: '034f309b-57ed-4268-a836-ebbc6a8a03cb',
  assistant_supervisor: '25242903-ddc3-40e4-ba5d-8cbb490fa624',
  driver_truck: '0d01235e-b555-4534-89e7-1c673b9cc67e',
  driver_machine: '3fa07290-8529-42a8-827f-d042535da0e5',
  surveyor: '15887394-07bf-4e53-b7ea-17b0213f4eff',
  accountant: '55797b20-375d-47b9-b487-7eb67ee7d33d',
};

function requireEnv(name) {
  const v = process.env[name];
  if (!v || !v.trim()) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return v.trim();
}
const url = requireEnv('SUPABASE_URL');
const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
const ownerPassword = requireEnv('TEST_USER_PASSWORD');
try {
  const payload = JSON.parse(Buffer.from(serviceKey.split('.')[1], 'base64url').toString('utf8'));
  if (payload.role !== 'service_role') { console.error('Key is not a service_role key.'); process.exit(1); }
} catch { /* non-JWT key formats are validated by the API */ }

const sb = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const log = (...a) => console.log(...a);
const iso = (d) => d.toISOString();
const daysAgo = (n, h = 8) => { const d = new Date(); d.setUTCDate(d.getUTCDate() - n); d.setUTCHours(h, 0, 0, 0); return d; };
const dateOnly = (d) => d.toISOString().slice(0, 10);
const plusHours = (d, h) => new Date(d.getTime() + h * 3600_000);

async function upsert(table, rows, onConflict = 'id') {
  const list = Array.isArray(rows) ? rows : [rows];
  const { error } = await sb.from(table).upsert(list, { onConflict });
  if (error) throw new Error(`${table} upsert failed: ${error.message}`);
  return list.length;
}

/** Uploads a repo JPEG to a bucket under the test prefix; returns its public URL and path. */
async function uploadJpeg(bucket, path, localFile) {
  const fullPath = `${TAG}/${path}`;
  const bytes = readFileSync(localFile);
  const { error } = await sb.storage.from(bucket).upload(fullPath, bytes, { contentType: 'image/jpeg', upsert: true });
  if (error) throw new Error(`upload ${bucket}/${fullPath} failed: ${error.message}`);
  const { data } = sb.storage.from(bucket).getPublicUrl(fullPath);
  return { url: data.publicUrl, path: fullPath };
}

// Company photos already in the repo (23–55 KB — same size band the app targets).
const JPEGS = ['64', '85', '43', '34', '41', '67', '84', '49', '80', '26'].map((n) => `src/assets/hapyjo/${n}.jpeg`);
const jpeg = (i) => JPEGS[i % JPEGS.length];

// Realistic coordinates around Kigali / Bugesera.
const GEO = {
  alpha: { lat: -1.9536, lng: 30.0606, city: 'Kigali', region: 'Kigali City' },
  beta: { lat: -2.3093, lng: 30.0058, city: 'Ruhuha', region: 'Eastern Province' },
  gamma: { lat: -1.9706, lng: 30.1044, city: 'Kigali', region: 'Kigali City' },
};

// ---------------------------------------------------------------------------
// 0. Test profiles (test rows only)
// ---------------------------------------------------------------------------
async function seedProfiles(siteIds) {
  // test.owner was created earlier without role metadata; make it the owner it is meant to be.
  const { error: pwErr } = await sb.auth.admin.updateUserById(USERS.owner, {
    password: ownerPassword,
    user_metadata: { role: 'owner', name: 'Test Owner' },
    app_metadata: { provisioned_by: 'hapyjo_admin' },
  });
  if (pwErr) throw new Error(`owner auth update failed: ${pwErr.message}`);
  const { error: oErr } = await sb.from('profiles').update({ role: 'owner', name: 'Test Owner', active: true }).eq('id', USERS.owner);
  if (oErr) throw new Error(`owner profile update failed: ${oErr.message}`);

  // Site-scoped roles get site_access = the three test sites (the app derives this
  // from site_assignments too; the column is kept consistent).
  for (const role of ['head_supervisor', 'assistant_supervisor', 'surveyor', 'driver_truck', 'driver_machine']) {
    const { error } = await sb.from('profiles').update({ site_access: siteIds }).eq('id', USERS[role]);
    if (error) throw new Error(`site_access update (${role}) failed: ${error.message}`);
  }
  log('profiles: test.owner corrected to owner; site_access set on 5 site-scoped test users');
}

// ---------------------------------------------------------------------------
// 1. Sites
// ---------------------------------------------------------------------------
const SITES = [
  {
    id: `${P}site_alpha`, key: 'alpha', name: `${TAG} Alpha Construction Site`, location: 'Kigali, Gasabo District',
    start: daysAgo(90), end: 60, budget: 45_000_000, rate: 3500,
    contractor: `${TAG} Alpha Contractors Ltd`, details: `${TAG} Contract A-2026-01: excavation and site preparation, 12,000 m3 at 3,500 RWF/m3.`,
  },
  {
    id: `${P}site_beta`, key: 'beta', name: `${TAG} Beta Road Project`, location: 'Ruhuha, Bugesera District',
    start: daysAgo(45), end: 120, budget: 82_000_000, rate: 4200,
    contractor: `${TAG} Beta Roads SARL`, details: `${TAG} Contract B-2026-02: 4.5 km feeder road earthworks and compaction.`,
  },
  {
    id: `${P}site_gamma`, key: 'gamma', name: `${TAG} Gamma Infrastructure Site`, location: 'Kigali, Kicukiro District',
    start: daysAgo(20), end: 200, budget: 120_000_000, rate: 3900,
    contractor: `${TAG} Gamma Infrastructure Group`, details: `${TAG} Contract G-2026-03: drainage and platform levelling, phase 1.`,
  },
];

async function seedSites() {
  const rows = SITES.map((s, i) => ({
    id: s.id, name: s.name, location: s.location, status: 'active',
    start_date: dateOnly(s.start), expected_end_date: dateOnly(plusHours(new Date(), 24 * s.end)),
    budget: s.budget, contract_rate_rwf: s.rate,
    contractor_name: s.contractor, contract_details: s.details,
    manager: 'Test Head Supervisor',
    assistant_supervisor_id: USERS.assistant_supervisor, surveyor_id: USERS.surveyor,
    driver_ids: [USERS.driver_truck, USERS.driver_machine],
    vehicle_ids: [`${P}truck_0${i + 1}`, `${P}machine_0${i + 1}`],
  }));
  // Only set spent / progress / total_excavated_m3 on first creation; afterwards the triggers own them.
  const { data: existing } = await sb.from('sites').select('id').in('id', rows.map((r) => r.id));
  const existingIds = new Set((existing ?? []).map((r) => r.id));
  for (const r of rows) {
    if (!existingIds.has(r.id)) Object.assign(r, { spent: 0, progress: 0, total_excavated_m3: 0 });
  }
  await upsert('sites', rows);
  log(`sites: ${rows.length}`);
}

// ---------------------------------------------------------------------------
// 2. Site tasks — reshape the 9 the trigger created per site
// ---------------------------------------------------------------------------
async function seedSiteTasks() {
  // status by default task name; weights stay as the trigger set them (sum 100)
  const plan = {
    'Pre-cut survey': ['completed', 100],
    'Land clearing': ['completed', 100],
    'Excavation': ['in_progress', 55],
    'Rock breaking': ['started', 20],
    'Soil transport': ['in_progress', 40],
    'Leveling': ['not_started', 0],
    'Compaction': ['not_started', 0],
    'After-cut survey': ['not_started', 0],
    'Final finishing': ['not_started', 0],
  };
  let n = 0;
  for (const s of SITES) {
    const { data, error } = await sb.from('site_tasks').select('id,task_name').eq('site_id', s.id);
    if (error) throw new Error(`site_tasks read failed: ${error.message}`);
    for (const row of data ?? []) {
      const base = row.task_name.replace(`${TAG} `, '');
      const [status, progress] = plan[base] ?? ['not_started', 0];
      const { error: uErr } = await sb.from('site_tasks').update({
        task_name: `${TAG} ${base}`, status, progress,
        notes: status === 'not_started' ? null : `${TAG} ${base} — ${progress}% (${s.key})`,
      }).eq('id', row.id);
      if (uErr) throw new Error(`site_tasks update failed: ${uErr.message}`);
      n++;
    }
  }
  log(`site_tasks: ${n} reshaped`);
}

// ---------------------------------------------------------------------------
// 3. Vehicles
// ---------------------------------------------------------------------------
async function seedVehicles() {
  const trucks = [1, 2, 3].map((i) => ({
    id: `${P}truck_0${i}`, site_id: SITES[i - 1].id, type: 'truck',
    vehicle_number_or_id: `TEST-E2E-TRUCK-0${i}`,
    mileage_km_per_litre: [4.5, 3.8, 5.2][i - 1], fuel_mode: 'km_per_l', fuel_rate: [4.5, 3.8, 5.2][i - 1],
    tank_capacity_litre: [300, 350, 280][i - 1], capacity_tons: [20, 25, 15][i - 1],
    ideal_consumption_range: '3.5-5.5 km/L', health_inputs: `${TAG} tyres ok; last service 2 weeks ago`,
    status: 'active',
  }));
  const machines = [1, 2, 3].map((i) => ({
    id: `${P}machine_0${i}`, site_id: SITES[i - 1].id, type: 'machine',
    vehicle_number_or_id: `TEST-E2E-MACHINE-0${i}`,
    hours_per_litre: [0.08, 0.07, 0.09][i - 1], fuel_mode: 'l_per_hour', fuel_rate: [12.5, 14.0, 11.0][i - 1],
    tank_capacity_litre: [400, 450, 380][i - 1],
    ideal_working_range: '8-10 hours/day', health_inputs: `${TAG} hydraulics ok`,
    status: 'active',
  }));
  const rows = [...trucks, ...machines];
  // Fuel balance is set on first creation only; afterwards fuel expenses/approvals own it.
  const { data: existing } = await sb.from('vehicles').select('id').in('id', rows.map((r) => r.id));
  const existingIds = new Set((existing ?? []).map((r) => r.id));
  for (const r of rows) if (!existingIds.has(r.id)) r.fuel_balance_litre = r.type === 'truck' ? 120 : 180;
  await upsert('vehicles', rows);
  log(`vehicles: ${rows.length} (3 trucks, 3 machines)`);
}

// ---------------------------------------------------------------------------
// 4. Assignments
// ---------------------------------------------------------------------------
async function seedAssignments() {
  const sa = [];
  for (const s of SITES) {
    const i = SITES.indexOf(s) + 1;
    sa.push({ site_id: s.id, user_id: USERS.head_supervisor, role: 'head_supervisor', vehicle_ids: [] });
    sa.push({ site_id: s.id, user_id: USERS.assistant_supervisor, role: 'assistant_supervisor', vehicle_ids: [`${P}truck_0${i}`, `${P}machine_0${i}`] });
    sa.push({ site_id: s.id, user_id: USERS.surveyor, role: 'surveyor', vehicle_ids: [] });
    sa.push({ site_id: s.id, user_id: USERS.driver_truck, role: 'driver_truck', vehicle_ids: [] });
    sa.push({ site_id: s.id, user_id: USERS.driver_machine, role: 'driver_machine', vehicle_ids: [] });
  }
  await upsert('site_assignments', sa, 'site_id,user_id');

  const dva = [];
  for (const s of SITES) {
    const i = SITES.indexOf(s) + 1;
    dva.push({ site_id: s.id, driver_id: USERS.driver_truck, vehicle_ids: [`${P}truck_0${i}`] });
    dva.push({ site_id: s.id, driver_id: USERS.driver_machine, vehicle_ids: [`${P}machine_0${i}`] });
  }
  await upsert('driver_vehicle_assignments', dva, 'site_id,driver_id');
  log(`site_assignments: ${sa.length}; driver_vehicle_assignments: ${dva.length}`);
}

// ---------------------------------------------------------------------------
// 5. General tasks + operations
// ---------------------------------------------------------------------------
async function seedTasksAndOperations() {
  const tasks = [
    { id: `${P}task_01`, site: 0, title: `${TAG} Owner review of Alpha contract`, status: 'pending', priority: 'high', progress: 0, due: 7, to: [USERS.owner, USERS.admin] },
    { id: `${P}task_02`, site: 0, title: `${TAG} Weekly site inspection`, status: 'in_progress', priority: 'medium', progress: 40, due: 3, to: [USERS.head_supervisor, USERS.assistant_supervisor] },
    { id: `${P}task_03`, site: 1, title: `${TAG} Pre-cut survey for Beta chainage 0-1.5km`, status: 'completed', priority: 'high', progress: 100, due: -2, to: [USERS.surveyor] },
    { id: `${P}task_04`, site: 1, title: `${TAG} Haul murram to Beta stockpile`, status: 'in_progress', priority: 'medium', progress: 60, due: 2, to: [USERS.driver_truck] },
    { id: `${P}task_05`, site: 2, title: `${TAG} Excavator platform levelling`, status: 'pending', priority: 'low', progress: 0, due: 10, to: [USERS.driver_machine] },
    { id: `${P}task_06`, site: 2, title: `${TAG} Fuel reconciliation for Gamma`, status: 'completed', priority: 'low', progress: 100, due: -5, to: [USERS.accountant, USERS.assistant_supervisor] },
  ].map((t) => ({
    id: t.id, title: t.title, description: `${TAG} — ${t.title.replace(`${TAG} `, '')}. Created for end-to-end testing.`,
    site_id: SITES[t.site].id, site_name: SITES[t.site].name, assigned_to: t.to,
    status: t.status, priority: t.priority, due_date: dateOnly(plusHours(new Date(), 24 * t.due)), progress: t.progress, photos: [],
  }));
  await upsert('tasks', tasks);

  const ops = [
    { id: `${P}op_01`, site: 0, name: `${TAG} Mobilisation`, type: 'logistics', status: 'completed', budget: 2_500_000, spent: 2_350_000, start: 88, end: 80 },
    { id: `${P}op_02`, site: 0, name: `${TAG} Bulk excavation phase 1`, type: 'excavation', status: 'ongoing', budget: 18_000_000, spent: 9_200_000, start: 75, end: null },
    { id: `${P}op_03`, site: 1, name: `${TAG} Road formation`, type: 'earthworks', status: 'ongoing', budget: 30_000_000, spent: 11_400_000, start: 40, end: null },
    { id: `${P}op_04`, site: 1, name: `${TAG} Culvert installation`, type: 'drainage', status: 'planned', budget: 12_000_000, spent: 0, start: -14, end: null },
    { id: `${P}op_05`, site: 2, name: `${TAG} Site clearing`, type: 'clearing', status: 'completed', budget: 3_000_000, spent: 2_900_000, start: 18, end: 10 },
    { id: `${P}op_06`, site: 2, name: `${TAG} Platform levelling`, type: 'earthworks', status: 'planned', budget: 25_000_000, spent: 0, start: -7, end: null },
  ].map((o) => ({
    id: o.id, name: o.name, site_id: SITES[o.site].id, site_name: SITES[o.site].name, type: o.type, status: o.status,
    budget: o.budget, spent: o.spent, start_date: dateOnly(daysAgo(o.start)), end_date: o.end == null ? null : dateOnly(daysAgo(o.end)),
    crew: ['Test Assistant Supervisor', 'Test Truck Driver', 'Test Machine Driver'],
  }));
  await upsert('operations', ops);
  log(`tasks: ${tasks.length}; operations: ${ops.length}`);
}

// ---------------------------------------------------------------------------
// 6. Expenses (trigger: general -> sites.spent; fuel -> spent + vehicle litres)
// ---------------------------------------------------------------------------
async function seedExpenses() {
  const general = [
    ['maintenance', 0, 850_000, 'Excavator hydraulic hose replacement'],
    ['spare_parts', 0, 420_000, 'Truck brake pads and filters'],
    ['operator_wages', 1, 1_800_000, 'Operator wages week 36'],
    ['labour_cost', 1, 2_400_000, 'Casual labour, road formation'],
    ['machine_rental', 1, 3_200_000, 'Roller rental 6 days'],
    ['vehicle_rental', 2, 1_500_000, 'Water bowser rental'],
    ['tools_equipment', 2, 275_000, 'Hand tools and safety gear'],
    ['food_allowance', 0, 360_000, 'Crew meals week 36'],
    ['office_expense', 2, 95_000, 'Site office stationery'],
    ['other', 2, 150_000, 'Community liaison'],
    ['maintenance', 1, 640_000, 'Truck tyre repair'],
  ].map(([cat, site, amt, desc], i) => ({
    id: `${P}exp_g${String(i + 1).padStart(2, '0')}`, site_id: SITES[site].id, amount_rwf: amt,
    description: `${TAG} ${desc}`, date: dateOnly(daysAgo(14 - i)), type: 'general', expense_category: cat,
  }));
  const fuel = [
    [0, `${P}truck_01`, 120, 1650],
    [1, `${P}machine_02`, 200, 1650],
    [2, `${P}truck_03`, 90, 1680],
  ].map(([site, vehicle, litres, cpl], i) => ({
    id: `${P}exp_f0${i + 1}`, site_id: SITES[site].id, amount_rwf: litres * cpl, fuel_cost: litres * cpl,
    description: `${TAG} Diesel refuel ${litres} L`, date: dateOnly(daysAgo(6 - i)), type: 'fuel', expense_category: 'fuel',
    vehicle_id: vehicle, litres, cost_per_litre: cpl,
  }));
  // Insert-only for expenses: the trigger accrues on every INSERT, so re-running must not re-insert.
  const all = [...general, ...fuel];
  const { data: existing } = await sb.from('expenses').select('id').in('id', all.map((r) => r.id));
  const existingIds = new Set((existing ?? []).map((r) => r.id));
  const fresh = all.filter((r) => !existingIds.has(r.id));
  if (fresh.length) {
    const { error } = await sb.from('expenses').insert(fresh);
    if (error) throw new Error(`expenses insert failed: ${error.message}`);
  }
  log(`expenses: ${fresh.length} inserted (${all.length - fresh.length} already existed)`);
}

// ---------------------------------------------------------------------------
// 7. Surveys (trigger: approved -> sites.total_excavated_m3)
// ---------------------------------------------------------------------------
async function seedSurveys() {
  const rows = [
    { id: `${P}survey_01`, site: 0, date: 30, vol: 1850.5, status: 'approved', by: USERS.head_supervisor, notes: 'Cut section A1-A4' },
    { id: `${P}survey_02`, site: 1, date: 21, vol: 2410.0, status: 'approved', by: USERS.head_supervisor, notes: 'Chainage 0+000 to 0+800' },
    { id: `${P}survey_03`, site: 2, date: 9, vol: 620.25, status: 'approved', by: USERS.assistant_supervisor, notes: 'Platform north corner' },
    { id: `${P}survey_04`, site: 0, date: 3, vol: 940.0, status: 'approval_pending', notes: 'Cut section A5-A6, awaiting approval' },
    { id: `${P}survey_05`, site: 1, date: 5, vol: 1275.0, status: 'rejected', by: USERS.head_supervisor, notes: 'Rejected: TOP file missing rows 40-52' },
    { id: `${P}survey_06`, site: 1, date: 2, vol: 1290.4, status: 'approval_pending', revision_of: `${P}survey_05`, notes: 'Revision of rejected survey with corrected TOP file' },
  ].map((s) => ({
    id: s.id, site_id: SITES[s.site].id, surveyor_id: USERS.surveyor, status: s.status,
    survey_date: dateOnly(daysAgo(s.date)), volume_m3: s.vol, notes: `${TAG} ${s.notes}`,
    approved_by_id: s.status === 'approval_pending' ? null : s.by,
    approved_at: s.status === 'approval_pending' ? null : iso(daysAgo(s.date - 1, 15)),
    revision_of: s.revision_of ?? null,
    created_at: iso(daysAgo(s.date, 9)),
  }));
  // Insert-only (approval trigger accrues volume on INSERT/UPDATE to approved).
  const { data: existing } = await sb.from('surveys').select('id').in('id', rows.map((r) => r.id));
  const existingIds = new Set((existing ?? []).map((r) => r.id));
  const fresh = rows.filter((r) => !existingIds.has(r.id));
  // revision_of must reference an existing row: insert parents first.
  fresh.sort((a, b) => (a.revision_of ? 1 : 0) - (b.revision_of ? 1 : 0));
  for (const r of fresh) {
    const { error } = await sb.from('surveys').insert(r);
    if (error) throw new Error(`surveys insert failed (${r.id}): ${error.message}`);
  }
  log(`surveys: ${fresh.length} inserted (${rows.length - fresh.length} already existed)`);
}

// ---------------------------------------------------------------------------
// 8. Issues (with real photos in issue-images)
// ---------------------------------------------------------------------------
async function seedIssues() {
  const img1 = await uploadJpeg('issue-images', `issue/${P}issue_01/photo-1.jpg`, jpeg(0));
  const img2 = await uploadJpeg('issue-images', `issue/${P}issue_03/photo-1.jpg`, jpeg(1));
  const rows = [
    { id: `${P}issue_01`, site: 0, by: USERS.driver_truck, role: 'driver_truck', status: 'open', days: 2, desc: 'Truck TEST-E2E-TRUCK-01 rear tyre puncture on haul road', images: [img1.path] },
    { id: `${P}issue_02`, site: 1, by: USERS.assistant_supervisor, role: 'assistant_supervisor', status: 'open', days: 1, desc: 'Water pooling at chainage 0+450 after rain', images: [] },
    { id: `${P}issue_03`, site: 1, by: USERS.driver_machine, role: 'driver_machine', status: 'acknowledged', days: 4, desc: 'Excavator TEST-E2E-MACHINE-02 hydraulic leak', images: [img2.path] },
    { id: `${P}issue_04`, site: 2, by: USERS.surveyor, role: 'surveyor', status: 'resolved', days: 8, desc: 'Benchmark BM-3 disturbed, re-established', resolvedBy: USERS.assistant_supervisor, resolvedDays: 6, images: [] },
    { id: `${P}issue_05`, site: 0, by: USERS.driver_truck, role: 'driver_truck', status: 'resolved', days: 12, desc: 'Fuel card not accepted at station', resolvedBy: USERS.head_supervisor, resolvedDays: 11, images: [] },
  ].map((i) => ({
    id: i.id, site_id: SITES[i.site].id, site_name: SITES[i.site].name, raised_by_id: i.by, created_by_role: i.role,
    description: `${TAG} ${i.desc}`, image_uris: i.images, status: i.status, created_at: iso(daysAgo(i.days, 10)),
    resolved_by: i.resolvedBy ?? null, resolved_at: i.resolvedDays == null ? null : iso(daysAgo(i.resolvedDays, 16)),
  }));
  await upsert('issues', rows);
  log(`issues: ${rows.length} (2 with photos)`);
}

// ---------------------------------------------------------------------------
// 9. Assigned trips (truck TRIP_* and machine TASK_*) with real evidence
// ---------------------------------------------------------------------------
async function seedAssignedTrips() {
  const ev = async (id, kind, i) => (await uploadJpeg('issue-images', `trip/${id}/${kind}.jpg`, jpeg(i))).url;
  const g = (k) => GEO[k];
  const specs = [
    // truck lifecycle on Alpha/Beta
    { id: `${P}at_truck_assigned`, k: 'alpha', v: `${P}truck_01`, d: USERS.driver_truck, type: 'truck', status: 'TRIP_ASSIGNED', task: 'Haul murram', days: 0 },
    { id: `${P}at_truck_started`, k: 'alpha', v: `${P}truck_01`, d: USERS.driver_truck, type: 'truck', status: 'TRIP_STARTED', task: 'Haul murram', days: 0, started: true },
    { id: `${P}at_truck_inprogress`, k: 'beta', v: `${P}truck_02`, d: USERS.driver_truck, type: 'truck', status: 'TRIP_IN_PROGRESS', task: 'Soil transport', days: 0, started: true },
    { id: `${P}at_truck_needapproval`, k: 'alpha', v: `${P}truck_01`, d: USERS.driver_truck, type: 'truck', status: 'TRIP_NEED_APPROVAL', task: 'Soil transport', days: 1, started: true, ended: true },
    { id: `${P}at_truck_completed`, k: 'gamma', v: `${P}truck_03`, d: USERS.driver_truck, type: 'truck', status: 'TRIP_COMPLETED', task: 'Aggregate delivery', days: 3, started: true, ended: true, completed: true, startR: 45210, endR: 45262, fuel: 10 },
    // machine lifecycle
    { id: `${P}at_machine_assigned`, k: 'alpha', v: `${P}machine_01`, d: USERS.driver_machine, type: 'machine', status: 'TASK_ASSIGNED', task: 'Excavation', days: 0 },
    { id: `${P}at_machine_started`, k: 'alpha', v: `${P}machine_01`, d: USERS.driver_machine, type: 'machine', status: 'TASK_STARTED', task: 'Excavation', days: 0, started: true },
    { id: `${P}at_machine_inprogress`, k: 'beta', v: `${P}machine_02`, d: USERS.driver_machine, type: 'machine', status: 'TASK_IN_PROGRESS', task: 'Levelling', days: 0, started: true },
    { id: `${P}at_machine_needapproval`, k: 'alpha', v: `${P}machine_01`, d: USERS.driver_machine, type: 'machine', status: 'TASK_NEED_APPROVAL', task: 'Levelling', days: 1, started: true, ended: true },
    { id: `${P}at_machine_completed`, k: 'gamma', v: `${P}machine_03`, d: USERS.driver_machine, type: 'machine', status: 'TASK_COMPLETED', task: 'Trenching', days: 4, started: true, ended: true, completed: true, startR: 1210.5, endR: 1217.0, fuel: 71.5 },
  ];
  const rows = [];
  let n = 0;
  for (const s of specs) {
    const start = daysAgo(s.days, 7);
    const end = plusHours(start, s.type === 'truck' ? 3 : 6.5);
    const row = {
      id: s.id, site_id: `${P}site_${s.k}`, vehicle_id: s.v, driver_id: s.d, vehicle_type: s.type, task_type: s.task,
      status: s.status, notes: `${TAG} ${s.task} (${s.status})`, created_by: USERS.assistant_supervisor,
      created_at: iso(plusHours(start, -1)), pause_segments: [],
    };
    if (s.started) {
      Object.assign(row, {
        started_at: iso(start), start_photo_url: await ev(s.id, 'start', n++),
        start_gps_lat: g(s.k).lat, start_gps_lng: g(s.k).lng,
      });
    }
    if (s.ended) {
      Object.assign(row, {
        ended_at: iso(end), end_photo_url: await ev(s.id, 'end', n++),
        end_gps_lat: g(s.k).lat + 0.012, end_gps_lng: g(s.k).lng + 0.009,
      });
    }
    if (s.completed) {
      const usage = +(s.endR - s.startR).toFixed(2);
      Object.assign(row, {
        start_reading: s.startR, end_reading: s.endR,
        distance_km: s.type === 'truck' ? usage : null, hours_used: s.type === 'machine' ? usage : null,
        fuel_used_l: s.fuel, validation_notes: `${TAG} readings verified`,
        validated_by: USERS.assistant_supervisor, validated_at: iso(plusHours(end, 2)),
        completed_by: USERS.assistant_supervisor, completed_at: iso(plusHours(end, 2)),
        evidence_expires_at: iso(plusHours(end, 2 + 72)),
      });
    }
    rows.push(row);
  }
  await upsert('assigned_trips', rows);
  log(`assigned_trips: ${rows.length} (5 truck states, 5 machine states); evidence photos uploaded: ${n}`);
}

// ---------------------------------------------------------------------------
// 10. Trips (trucks) + machine sessions (machines), linked to assigned trips
// ---------------------------------------------------------------------------
async function seedTripsAndSessions() {
  const gStart = daysAgo(3, 7), gEnd = plusHours(gStart, 3);
  const bStart = daysAgo(0, 7);
  const startUrl = (id) => sb.storage.from('issue-images').getPublicUrl(`${TAG}/trip/${id}/start.jpg`).data.publicUrl;
  const endUrl = (id) => sb.storage.from('issue-images').getPublicUrl(`${TAG}/trip/${id}/end.jpg`).data.publicUrl;
  const trips = [
    {
      id: `${P}trip_completed`, assigned_trip_id: `${P}at_truck_completed`, vehicle_id: `${P}truck_03`, driver_id: USERS.driver_truck, site_id: `${P}site_gamma`,
      start_time: iso(gStart), end_time: iso(gEnd), start_lat: GEO.gamma.lat, start_lon: GEO.gamma.lng, end_lat: GEO.gamma.lat + 0.012, end_lon: GEO.gamma.lng + 0.009,
      distance_km: 52, load_quantity: '15 tons aggregate', status: 'completed', fuel_filled_at_start: 60, fuel_consumed: 10,
      start_photo_uri: startUrl(`${P}at_truck_completed`), photo_uri: endUrl(`${P}at_truck_completed`), created_at: iso(gStart),
    },
    {
      id: `${P}trip_inprogress`, assigned_trip_id: `${P}at_truck_inprogress`, vehicle_id: `${P}truck_02`, driver_id: USERS.driver_truck, site_id: `${P}site_beta`,
      start_time: iso(bStart), start_lat: GEO.beta.lat, start_lon: GEO.beta.lng, distance_km: 0, load_quantity: '18 tons murram', status: 'in_progress',
      fuel_filled_at_start: 40, current_lat: GEO.beta.lat + 0.004, current_lon: GEO.beta.lng + 0.003, location_updated_at: iso(new Date()),
      start_photo_uri: startUrl(`${P}at_truck_inprogress`), created_at: iso(bStart),
    },
  ];
  await upsert('trips', trips);

  const mStart = daysAgo(4, 7), mEnd = plusHours(mStart, 6.5);
  const sessions = [
    {
      id: `${P}ms_completed`, assigned_trip_id: `${P}at_machine_completed`, vehicle_id: `${P}machine_03`, driver_id: USERS.driver_machine, site_id: `${P}site_gamma`,
      start_time: iso(mStart), end_time: iso(mEnd), duration_hours: 6.5, fuel_consumed: 71.5, validated_fuel_used_l: 71.5, status: 'completed', created_at: iso(mStart),
    },
    {
      id: `${P}ms_inprogress`, assigned_trip_id: `${P}at_machine_inprogress`, vehicle_id: `${P}machine_02`, driver_id: USERS.driver_machine, site_id: `${P}site_beta`,
      start_time: iso(bStart), status: 'in_progress', created_at: iso(bStart),
    },
  ];
  await upsert('machine_sessions', sessions);
  log(`trips: ${trips.length}; machine_sessions: ${sessions.length}`);
}

// ---------------------------------------------------------------------------
// 11. Reports (JSON shaped for ReportsScreen)
// ---------------------------------------------------------------------------
async function seedReports() {
  const { data: sites, error } = await sb.from('sites').select('id,name,budget,spent,progress').in('id', SITES.map((s) => s.id));
  if (error) throw new Error(`sites read for reports failed: ${error.message}`);
  const summary = (sites ?? []).map((s) => {
    const remaining = Number(s.budget) - Number(s.spent);
    return { siteName: s.name, budget: Number(s.budget), spent: Number(s.spent), remaining, utilizationPct: s.budget ? Math.round((Number(s.spent) / Number(s.budget)) * 100) : 0, progress: Number(s.progress) };
  });
  const totalBudget = summary.reduce((a, s) => a + s.budget, 0);
  const totalSpent = summary.reduce((a, s) => a + s.spent, 0);
  const { data: exp } = await sb.from('expenses').select('site_id,type,amount_rwf,fuel_cost').in('site_id', SITES.map((s) => s.id));
  const sitesExpenses = SITES.map((s) => {
    const mine = (exp ?? []).filter((e) => e.site_id === s.id);
    const fuel = mine.filter((e) => e.type === 'fuel').reduce((a, e) => a + Number(e.fuel_cost ?? e.amount_rwf), 0);
    const general = mine.filter((e) => e.type === 'general').reduce((a, e) => a + Number(e.amount_rwf), 0);
    return { siteName: s.name, totalExpenses: fuel + general, fuelExpenses: fuel, generalExpenses: general };
  });
  const month = new Date().toISOString().slice(0, 7);
  const rows = [
    { id: `${P}report_financial`, title: `${TAG} Financial summary ${month}`, type: 'financial', generated_date: dateOnly(new Date()), period: month,
      data: { totalBudget, totalSpent, remainingBudget: totalBudget - totalSpent, sitesSummary: summary } },
    { id: `${P}report_operations`, title: `${TAG} Operations summary ${month}`, type: 'operations', generated_date: dateOnly(new Date()), period: month,
      data: { activeSites: SITES.length, completedTasks: 2, pendingTasks: 2, trips: 1, sitesSummary: summary } },
    { id: `${P}report_site_performance`, title: `${TAG} Site performance ${month}`, type: 'site_performance', generated_date: dateOnly(new Date()), period: month,
      data: { activeSites: SITES.length, sitesSummary: summary, sitesExpenses } },
  ];
  await upsert('reports', rows);
  log(`reports: ${rows.length}`);
}

// ---------------------------------------------------------------------------
// 12. Notifications (role-/user-targeted, read/unread, linked to test records)
// ---------------------------------------------------------------------------
async function seedNotifications() {
  const rows = [
    ['n01', 'assistant_supervisor', null, 'Trip needs approval', `${TAG} Test Truck Driver ended Soil transport on Beta — readings required`, 'trip', `${P}at_truck_needapproval`, false, 1],
    ['n02', 'assistant_supervisor', null, 'Task needs approval', `${TAG} Test Machine Driver ended Levelling on Beta`, 'trip', `${P}at_machine_needapproval`, false, 1],
    ['n03', 'driver_truck', USERS.driver_truck, 'New trip assigned', `${TAG} Haul murram on Alpha with TEST-E2E-TRUCK-01`, 'trip', `${P}at_truck_assigned`, false, 0],
    ['n04', 'driver_machine', USERS.driver_machine, 'New task assigned', `${TAG} Excavation on Alpha with TEST-E2E-MACHINE-01`, 'trip', `${P}at_machine_assigned`, false, 0],
    ['n05', 'head_supervisor', null, 'Survey awaiting approval', `${TAG} Cut section A5-A6 (940 m3) on Alpha`, 'survey', `${P}survey_04`, false, 3],
    ['n06', 'head_supervisor', null, 'Issue reported', `${TAG} Water pooling at chainage 0+450 (Beta)`, 'issue', `${P}issue_02`, true, 1],
    ['n07', 'surveyor', USERS.surveyor, 'Survey rejected', `${TAG} Chainage survey rejected: TOP file missing rows 40-52`, 'survey', `${P}survey_05`, true, 5],
    ['n08', 'accountant', null, 'Expense recorded', `${TAG} Roller rental 6 days — 3,200,000 RWF (Beta)`, 'expense', `${P}exp_g05`, false, 10],
    ['n09', 'owner', null, 'Trip completed', `${TAG} Aggregate delivery on Gamma approved (52 km, 10 L)`, 'trip', `${P}at_truck_completed`, true, 3],
    ['n10', 'admin', null, 'Site created', `${TAG} Gamma Infrastructure Site added`, 'site', `${P}site_gamma`, true, 20],
    ['n11', 'driver_truck', USERS.driver_truck, 'Issue resolved', `${TAG} Fuel card not accepted — resolved`, 'issue', `${P}issue_05`, true, 11],
    ['n12', 'accountant', null, 'Report generated', `${TAG} Financial summary available`, 'report', `${P}report_financial`, false, 0],
  ].map(([id, role, uid, title, body, lt, lid, read, days]) => ({
    id: `${P}${id}`, target_role: role, target_user_id: uid, title, body, link_type: lt, link_id: lid, read, created_at: iso(daysAgo(days, 11)),
  }));
  await upsert('notifications', rows);
  log(`notifications: ${rows.length}`);
}

// ---------------------------------------------------------------------------
// 13. Budget allocations (sum to each site's budget), by Test Owner
// ---------------------------------------------------------------------------
async function seedBudgetAllocations() {
  const rows = [
    [`${P}alloc_alpha_1`, 0, 30_000_000, 85], [`${P}alloc_alpha_2`, 0, 15_000_000, 40],
    [`${P}alloc_beta_1`, 1, 50_000_000, 44], [`${P}alloc_beta_2`, 1, 32_000_000, 20],
    [`${P}alloc_gamma_1`, 2, 70_000_000, 19], [`${P}alloc_gamma_2`, 2, 50_000_000, 5],
  ].map(([id, site, amt, days]) => ({ id, site_id: SITES[site].id, amount_rwf: amt, allocated_at: iso(daysAgo(days, 9)), allocated_by: USERS.owner }));
  await upsert('site_budget_allocations', rows);
  log(`site_budget_allocations: ${rows.length}`);
}

// ---------------------------------------------------------------------------
// 14. Work photos + GPS photos (real JPEGs under the test prefix)
// ---------------------------------------------------------------------------
async function seedPhotos() {
  const work = [];
  const specs = [
    ['alpha', USERS.surveyor, 'surveyor', 1], ['alpha', USERS.assistant_supervisor, 'assistant_supervisor', 2],
    ['beta', USERS.driver_truck, 'driver_truck', 0], ['beta', USERS.assistant_supervisor, 'assistant_supervisor', 3],
    ['gamma', USERS.driver_machine, 'driver_machine', 1], ['gamma', USERS.head_supervisor, 'head_supervisor', 0],
  ];
  // Deterministic UUIDs so re-runs upsert the same rows (v4-shaped, fixed suffix).
  const wid = (i) => `e2e00000-0000-4000-8000-0000000000${String(i + 1).padStart(2, '0')}`;
  for (let i = 0; i < specs.length; i++) {
    const [k, uid, role, days] = specs[i];
    const photo = await uploadJpeg('work-photos', `work/${wid(i)}/photo.jpg`, jpeg(i + 2));
    const thumb = await uploadJpeg('work-photos', `work/${wid(i)}/thumb.jpg`, jpeg(i + 2));
    work.push({
      id: wid(i), photo_url: photo.url, thumbnail_url: thumb.url,
      latitude: GEO[k].lat + i * 0.0007, longitude: GEO[k].lng + i * 0.0005,
      site_id: `${P}site_${k}`, project_id: TAG, uploaded_by: uid, user_role: role, created_at: iso(daysAgo(days, 12 + i)),
    });
  }
  await upsert('work_photos', work);

  const gps = [];
  const gid = (i) => `e2e00000-0000-4000-8000-00000000010${i + 1}`;
  for (let i = 0; i < 3; i++) {
    const k = ['alpha', 'beta', 'gamma'][i];
    const up = await uploadJpeg('gps-images', `gps/${gid(i)}.jpg`, jpeg(i + 5));
    gps.push({
      id: gid(i), user_id: USERS.surveyor, image_url: up.url, latitude: GEO[k].lat, longitude: GEO[k].lng,
      address: `${TAG} ${SITES[i].location}`, city: GEO[k].city, region: GEO[k].region, country: 'Rwanda', postal_code: null,
      captured_at: iso(daysAgo(i, 13)), created_at: iso(daysAgo(i, 13)),
    });
  }
  await upsert('gps_photos', gps);
  log(`work_photos: ${work.length}; gps_photos: ${gps.length}`);
}

// ---------------------------------------------------------------------------
async function main() {
  log(`Seeding ${TAG} …`);
  await seedSites();
  await seedProfiles(SITES.map((s) => s.id));
  await seedSiteTasks();
  await seedVehicles();
  await seedAssignments();
  await seedTasksAndOperations();
  await seedExpenses();
  await seedSurveys();
  await seedIssues();
  await seedAssignedTrips();
  await seedTripsAndSessions();
  await seedReports();
  await seedNotifications();
  await seedBudgetAllocations();
  await seedPhotos();
  log('Done.');
}

main().catch((e) => { console.error(e instanceof Error ? e.message : String(e)); process.exit(1); });
