-- ---------------------------------------------------------------------------
-- P1 SECURITY FIX: cross-site / cross-driver data leaks through FOR ALL policies
--
-- Findings (verified with real test sessions):
--   * "Assistant supervisor write expenses" was FOR ALL with USING role='assistant_supervisor'.
--     FOR ALL implies SELECT, so every assistant supervisor could read (and edit /
--     delete) EVERY site's expenses — the dedicated "Expenses read by role" policy
--     (own sites only) was silently bypassed. The Expenses tab showed other sites'
--     expenses with raw site ids.
--   * "Trips write by drivers and management" / "Machine_sessions write by drivers
--     and management" were FOR ALL for drivers too, so a driver could read every
--     other driver's trips and machine sessions across all sites (the read policies
--     say driver_id = auth.uid()).
--
-- Fix: replace the FOR ALL policies with explicit INSERT / UPDATE / DELETE
-- policies. Read access is now governed only by the existing *read* policies.
--   * Assistant supervisors write expenses only for sites they are assigned to
--     (site_assignments) or supervise (sites.assistant_supervisor_id).
--   * Drivers/operators write only their own trips / machine sessions
--     (driver_id = auth.uid()); management roles keep their existing write access.
-- Additive, no data change.
-- ---------------------------------------------------------------------------

-- Sites an assistant supervisor is responsible for.
CREATE OR REPLACE FUNCTION public.is_my_supervised_site(p_site_id text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.site_assignments sa
    WHERE sa.site_id = p_site_id AND sa.user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.sites s
    WHERE s.id = p_site_id AND s.assistant_supervisor_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------- expenses
DROP POLICY IF EXISTS "Assistant supervisor write expenses" ON public.expenses;

CREATE POLICY "Assistant supervisor insert expenses for own sites" ON public.expenses
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() = 'assistant_supervisor'::public.app_role
              AND public.is_my_supervised_site(site_id));

CREATE POLICY "Assistant supervisor update expenses for own sites" ON public.expenses
  FOR UPDATE TO authenticated
  USING (public.current_user_role() = 'assistant_supervisor'::public.app_role
         AND public.is_my_supervised_site(site_id))
  WITH CHECK (public.current_user_role() = 'assistant_supervisor'::public.app_role
              AND public.is_my_supervised_site(site_id));

CREATE POLICY "Assistant supervisor delete expenses for own sites" ON public.expenses
  FOR DELETE TO authenticated
  USING (public.current_user_role() = 'assistant_supervisor'::public.app_role
         AND public.is_my_supervised_site(site_id));

-- ------------------------------------------------------------------- trips
DROP POLICY IF EXISTS "Trips write by drivers and management" ON public.trips;

CREATE POLICY "Trips insert by drivers (own) and management" ON public.trips
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_role()::text IN ('admin','owner','head_supervisor','assistant_supervisor')
    OR (public.current_user_role()::text IN ('driver_truck','driver_machine') AND driver_id = auth.uid())
  );

CREATE POLICY "Trips update by drivers (own) and management" ON public.trips
  FOR UPDATE TO authenticated
  USING (
    public.current_user_role()::text IN ('admin','owner','head_supervisor','assistant_supervisor')
    OR (public.current_user_role()::text IN ('driver_truck','driver_machine') AND driver_id = auth.uid())
  )
  WITH CHECK (
    public.current_user_role()::text IN ('admin','owner','head_supervisor','assistant_supervisor')
    OR (public.current_user_role()::text IN ('driver_truck','driver_machine') AND driver_id = auth.uid())
  );

CREATE POLICY "Trips delete by management" ON public.trips
  FOR DELETE TO authenticated
  USING (public.current_user_role()::text IN ('admin','owner','head_supervisor','assistant_supervisor'));

-- -------------------------------------------------------- machine_sessions
DROP POLICY IF EXISTS "Machine_sessions write by drivers and management" ON public.machine_sessions;

CREATE POLICY "Machine_sessions insert by drivers (own) and management" ON public.machine_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_role() IN ('admin','owner','head_supervisor','assistant_supervisor')
    OR (public.current_user_role() IN ('driver_truck','driver_machine') AND driver_id = auth.uid())
  );

CREATE POLICY "Machine_sessions update by drivers (own) and management" ON public.machine_sessions
  FOR UPDATE TO authenticated
  USING (
    public.current_user_role() IN ('admin','owner','head_supervisor','assistant_supervisor')
    OR (public.current_user_role() IN ('driver_truck','driver_machine') AND driver_id = auth.uid())
  )
  WITH CHECK (
    public.current_user_role() IN ('admin','owner','head_supervisor','assistant_supervisor')
    OR (public.current_user_role() IN ('driver_truck','driver_machine') AND driver_id = auth.uid())
  );

CREATE POLICY "Machine_sessions delete by management" ON public.machine_sessions
  FOR DELETE TO authenticated
  USING (public.current_user_role() IN ('admin','owner','head_supervisor','assistant_supervisor'));

-- ---------------------------------------------------- tasks / operations
-- These were writable by EVERY authenticated user (FOR ALL USING true). The app
-- only ever UPDATEs tasks (status / progress / photos) from the task detail screen
-- used by assignees; nothing in the app inserts or deletes tasks or writes operations.
DROP POLICY IF EXISTS "Authenticated write tasks" ON public.tasks;
DROP POLICY IF EXISTS "Authenticated write operations" ON public.operations;

CREATE POLICY "Managers insert tasks" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('admin','owner','head_supervisor','assistant_supervisor'));

CREATE POLICY "Managers and assignees update tasks" ON public.tasks
  FOR UPDATE TO authenticated
  USING (
    public.current_user_role() IN ('admin','owner','head_supervisor','assistant_supervisor')
    OR auth.uid() = ANY (COALESCE(assigned_to, ARRAY[]::uuid[]))
  )
  WITH CHECK (
    public.current_user_role() IN ('admin','owner','head_supervisor','assistant_supervisor')
    OR auth.uid() = ANY (COALESCE(assigned_to, ARRAY[]::uuid[]))
  );

CREATE POLICY "Managers delete tasks" ON public.tasks
  FOR DELETE TO authenticated
  USING (public.current_user_role() IN ('admin','owner','head_supervisor','assistant_supervisor'));

CREATE POLICY "Managers write operations" ON public.operations
  FOR ALL TO authenticated
  USING (public.current_user_role() IN ('admin','owner','head_supervisor','assistant_supervisor'))
  WITH CHECK (public.current_user_role() IN ('admin','owner','head_supervisor','assistant_supervisor'));
