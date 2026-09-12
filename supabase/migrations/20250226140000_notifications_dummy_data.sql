-- Notifications dummy data for demo. Visible by role: each user sees rows where target_role = their profile.role.
-- Real-time: postgres_changes on public.notifications triggers refetch; RLS filters by current_user_role() so each
-- authenticated user gets only their role's notifications. Mark-as-read (close) uses UPDATE policy on same table.

-- IDs use n_seed_* to avoid conflict with existing demo-n-* and n_* rows. ON CONFLICT so re-run is safe.
INSERT INTO public.notifications (id, target_role, title, body, created_at, read, link_id, link_type) VALUES
-- admin (e.g. admin@hapyjo.com, demo-admin@hapyjo.com)
('n_seed_admin_1', 'admin', 'New user signup', 'A new user has been added. Review in Users.', now() - interval '2 hours', false, null, null),
('n_seed_admin_2', 'admin', 'System backup complete', 'Nightly backup completed successfully.', now() - interval '1 day', true, null, null),
('n_seed_admin_3', 'admin', 'Report ready', 'Monthly fuel report is available in Reports.', now() - interval '30 minutes', false, null, 'reports'),
-- owner (e.g. owner@hapyjo.com, demo-owner@hapyjo.com)
('n_seed_owner_1', 'owner', 'Expense submitted', 'Site Kigali submitted expenses for approval.', now() - interval '1 hour', false, null, 'expenses'),
('n_seed_owner_2', 'owner', 'Driver allocation updated', 'Head supervisor updated driver-vehicle assignments.', now() - interval '3 hours', false, null, null),
('n_seed_owner_3', 'owner', 'Survey completed', 'Surveyor completed a site survey. View in Surveys.', now() - interval '5 hours', true, null, 'surveys'),
-- head_supervisor (e.g. headsupervisor@hapyjo.com, demo-head@hapyjo.com, demo-as2@hapyjo.com)
('n_seed_hs_1', 'head_supervisor', 'Issue reported', 'Driver reported an issue at Site A. Please review.', now() - interval '45 minutes', false, null, 'issues'),
('n_seed_hs_2', 'head_supervisor', 'Vehicle low fuel', 'Truck T-01 fuel below 20%. Consider refuel.', now() - interval '2 hours', false, null, null),
('n_seed_hs_3', 'head_supervisor', 'Task assigned', 'New task assigned to you. Check Tasks tab.', now() - interval '4 hours', true, null, 'tasks'),
-- accountant (e.g. accountant@hapyjo.com, demo-accountant@hapyjo.com)
('n_seed_acc_1', 'accountant', 'Expense approved', 'Owner approved pending expenses. Sync records.', now() - interval '1 hour', false, null, 'expenses'),
('n_seed_acc_2', 'accountant', 'Reports tab updated', 'New data available in Reports.', now() - interval '6 hours', false, null, 'reports'),
-- assistant_supervisor (e.g. asstsupervisor@hapyjo.com, demo-as1@hapyjo.com, krishna@hapyjo.com)
('n_seed_as_1', 'assistant_supervisor', 'Fuel log added', 'Driver logged fuel for vehicle V-02.', now() - interval '30 minutes', false, null, 'expenses'),
('n_seed_as_2', 'assistant_supervisor', 'Task due today', 'Task "Site delivery" is due today.', now() - interval '2 hours', false, null, 'tasks'),
('n_seed_as_3', 'assistant_supervisor', 'Issue from driver', 'Driver reported equipment issue. See Issues.', now() - interval '1 day', true, null, 'issues'),
-- surveyor (e.g. surveyor@hapyjo.com, demo-surveyor1@hapyjo.com, demo-surveyor2@hapyjo.com, guna@hapyjo.com, etc.)
('n_seed_surv_1', 'surveyor', 'New survey request', 'Head supervisor requested a survey at Site B.', now() - interval '1 hour', false, null, 'surveys'),
('n_seed_surv_2', 'surveyor', 'Survey reminder', 'Complete pending surveys this week.', now() - interval '1 day', false, null, null),
-- driver_truck (e.g. drivertruck@hapyjo.com, demo-driver1@hapyjo.com, demo-driver2@hapyjo.com, demo-driver3@hapyjo.com)
('n_seed_dt_1', 'driver_truck', 'Trip assigned', 'You have been assigned a new trip. Check Tasks.', now() - interval '20 minutes', false, null, 'tasks'),
('n_seed_dt_2', 'driver_truck', 'Vehicle assigned', 'You have been assigned Truck T-03 at this site.', now() - interval '3 hours', false, null, null),
('n_seed_dt_3', 'driver_truck', 'Fuel reminder', 'Please log fuel after your next refill.', now() - interval '1 day', true, null, 'expenses'),
-- driver_machine (e.g. drivermachine@hapyjo.com, demo-mach1@hapyjo.com, demo-mach2@hapyjo.com, ram@hapyjo.com)
('n_seed_dm_1', 'driver_machine', 'Machine assigned', 'You have been assigned Machine M-01 at this site.', now() - interval '1 hour', false, null, null),
('n_seed_dm_2', 'driver_machine', 'Maintenance due', 'Scheduled maintenance for your machine next week.', now() - interval '5 hours', false, null, null),
('n_seed_dm_3', 'driver_machine', 'Task updated', 'Task "Earthworks" was updated. Check Tasks.', now() - interval '2 days', true, null, 'tasks')
ON CONFLICT (id) DO NOTHING;
