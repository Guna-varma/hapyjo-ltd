-- ---------------------------------------------------------------------------
-- P0 follow-up + P1 hardening
--
-- 1. Provisioning check moved to COMMIT time.
--    Verified live: GoTrue's admin createUser inserts auth.users first and applies
--    app_metadata in a second statement of the same transaction, so a BEFORE INSERT
--    check in handle_new_user() never sees app_metadata.provisioned_by and the
--    Users screen could not create accounts ("Database error creating new user").
--    The check is now a DEFERRABLE INITIALLY DEFERRED constraint trigger evaluated
--    at commit: admin-provisioned accounts (marker present) commit; a browser
--    signUp() (no marker) is rolled back — no auth user, no profile.
--    handle_new_user() keeps its metadata-role mapping, but every new profile starts
--    INACTIVE; create_user_by_owner explicitly activates it.
--
-- 2. Deactivated users lose API access, not just the UI.
--    current_user_role() now returns NULL unless profiles.active, and the read
--    policies that were open to every authenticated user (site_assignments,
--    driver_vehicle_assignments, tasks, operations) or that read profiles.role
--    directly (issues, work_photos, storage issue-images delete) now go through it.
--    A deactivated account keeps only "read own profile" (so the app can sign it
--    out) and nothing else.
-- Additive; existing rows unchanged.
-- ---------------------------------------------------------------------------

-- 1a. handle_new_user: no longer raises at insert; profiles start inactive.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  meta_role text;
  assign_role public.app_role;
BEGIN
  meta_role := NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), '');
  IF meta_role IN ('admin', 'owner', 'head_supervisor', 'accountant', 'assistant_supervisor', 'surveyor', 'driver_truck', 'driver_machine') THEN
    assign_role := meta_role::public.app_role;
  ELSE
    assign_role := 'driver_truck'::public.app_role;
  END IF;

  -- Inactive until the trusted provisioning path (create_user_by_owner) activates it.
  INSERT INTO public.profiles (id, name, email, role, site_access, active)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''), split_part(NEW.email, '@', 1)),
    NEW.email,
    assign_role,
    '{}',
    false
  );
  RETURN NEW;
END;
$function$;

-- 1b. Commit-time provisioning check.
CREATE OR REPLACE FUNCTION public.require_admin_provisioned_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_marker text;
BEGIN
  SELECT raw_app_meta_data->>'provisioned_by' INTO v_marker FROM auth.users WHERE id = NEW.id;
  IF COALESCE(v_marker, '') <> 'hapyjo_admin' THEN
    RAISE EXCEPTION 'Self-registration is disabled. Accounts are created by an administrator.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS auth_users_require_provisioning ON auth.users;
CREATE CONSTRAINT TRIGGER auth_users_require_provisioning
  AFTER INSERT ON auth.users
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.require_admin_provisioned_user();

-- 2a. Role helper honours the active flag.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() AND active;
$$;

-- 2b. Reads that were open to any authenticated JWT now require an active profile.
DROP POLICY IF EXISTS "Authenticated read site_assignments" ON public.site_assignments;
CREATE POLICY "Active users read site_assignments" ON public.site_assignments
  FOR SELECT TO authenticated USING (public.current_user_role() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated read driver_vehicle_assignments" ON public.driver_vehicle_assignments;
CREATE POLICY "Active users read driver_vehicle_assignments" ON public.driver_vehicle_assignments
  FOR SELECT TO authenticated USING (public.current_user_role() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated read tasks" ON public.tasks;
CREATE POLICY "Active users read tasks" ON public.tasks
  FOR SELECT TO authenticated USING (public.current_user_role() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated read operations" ON public.operations;
CREATE POLICY "Active users read operations" ON public.operations
  FOR SELECT TO authenticated USING (public.current_user_role() IS NOT NULL);

-- 2c. Policies that read profiles.role directly -> current_user_role() (same logic, active-aware).
DROP POLICY IF EXISTS "Issues read by creator or site or head/owner" ON public.issues;
CREATE POLICY "Issues read by creator or site or head/owner" ON public.issues
  FOR SELECT TO authenticated
  USING (
    (auth.uid() = raised_by_id AND public.current_user_role() IS NOT NULL)
    OR (public.current_user_role() = 'assistant_supervisor' AND EXISTS (
          SELECT 1 FROM public.site_assignments sa WHERE sa.site_id = issues.site_id AND sa.user_id = auth.uid()))
    OR public.current_user_role() IN ('head_supervisor', 'owner')
  );

DROP POLICY IF EXISTS "Raise issue by allowed roles" ON public.issues;
CREATE POLICY "Raise issue by allowed roles" ON public.issues
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = raised_by_id
              AND public.current_user_role() IN ('assistant_supervisor', 'driver_truck', 'driver_machine'));

DROP POLICY IF EXISTS "work_photos_insert_driver" ON public.work_photos;
CREATE POLICY "work_photos_insert_driver" ON public.work_photos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploaded_by AND public.current_user_role() IN ('driver_truck', 'driver_machine'));

DROP POLICY IF EXISTS "work_photos_insert_role" ON public.work_photos;
CREATE POLICY "work_photos_insert_role" ON public.work_photos
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploaded_by AND public.current_user_role() IN ('surveyor', 'assistant_supervisor'));

DROP POLICY IF EXISTS "work_photos_select_asst_site" ON public.work_photos;
CREATE POLICY "work_photos_select_asst_site" ON public.work_photos
  FOR SELECT TO authenticated
  USING (public.current_user_role() = 'assistant_supervisor' AND EXISTS (
           SELECT 1 FROM public.site_assignments sa WHERE sa.site_id = work_photos.site_id AND sa.user_id = auth.uid()));

DROP POLICY IF EXISTS "work_photos_select_driver_own" ON public.work_photos;
CREATE POLICY "work_photos_select_driver_own" ON public.work_photos
  FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('driver_truck', 'driver_machine') AND uploaded_by = auth.uid());

DROP POLICY IF EXISTS "work_photos_select_owner_head" ON public.work_photos;
CREATE POLICY "work_photos_select_owner_head" ON public.work_photos
  FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('owner', 'head_supervisor', 'admin'));

DROP POLICY IF EXISTS "work_photos_select_surveyor_own" ON public.work_photos;
CREATE POLICY "work_photos_select_surveyor_own" ON public.work_photos
  FOR SELECT TO authenticated
  USING (public.current_user_role() = 'surveyor' AND uploaded_by = auth.uid());

DROP POLICY IF EXISTS "Head supervisor owner delete issue-images" ON storage.objects;
CREATE POLICY "Head supervisor owner delete issue-images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'issue-images' AND public.current_user_role() IN ('head_supervisor', 'owner'));
