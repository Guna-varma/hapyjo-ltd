-- Allow owner to write site_assignments so User Management save (profile + site assignment) works for owner.
-- Previously only admin and head_supervisor could write; owner could update profiles but site assignment failed.
DROP POLICY IF EXISTS "Admin write site_assignments" ON public.site_assignments;
CREATE POLICY "Admin write site_assignments"
  ON public.site_assignments FOR ALL
  USING ((current_user_role()) IN ('admin', 'owner', 'head_supervisor'));
