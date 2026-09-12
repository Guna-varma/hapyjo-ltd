-- ---------------------------------------------------------------------------
-- P0 SECURITY FIX: profiles privileged columns (role / active / site_access / email)
--
-- Finding (verified with a real driver session against production):
--   UPDATE profiles SET role = 'owner' WHERE id = auth.uid()   -> succeeded.
-- The policy "Users can update own profile (name, phone)" only restricts the ROW,
-- and PostgREST grants UPDATE on every column, so any user could promote
-- themselves to owner/admin, re-activate a deactivated account, or grant
-- themselves site_access. Because current_user_role() reads profiles.role, this
-- compromised every other RLS policy in the schema.
--
-- Fix: a BEFORE UPDATE trigger that enforces the app's RBAC matrix
-- (lib/rbac.getAssignableRoles) on the privileged columns:
--   * nobody may change their OWN role / active / site_access / email;
--   * only admin / owner / head_supervisor may change them for others, and only
--     within the roles they are allowed to assign (owner cannot touch admins,
--     head_supervisor only manages assistant_supervisor / surveyor / drivers);
--   * service_role and direct SQL (no auth.uid()) are unaffected, so the
--     edge functions and the dashboard keep working.
-- Non-privileged columns (name, phone, last_lat/lon, ...) are untouched.
-- Additive and safe: no data is modified.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.assignable_roles_for(p_role public.app_role)
RETURNS public.app_role[]
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE p_role
    WHEN 'admin' THEN ARRAY['admin','owner','head_supervisor','accountant','assistant_supervisor','surveyor','driver_truck','driver_machine']::public.app_role[]
    WHEN 'owner' THEN ARRAY['owner','head_supervisor','accountant','assistant_supervisor','surveyor','driver_truck','driver_machine']::public.app_role[]
    WHEN 'head_supervisor' THEN ARRAY['assistant_supervisor','surveyor','driver_truck','driver_machine']::public.app_role[]
    ELSE ARRAY[]::public.app_role[]
  END;
$$;

CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_caller_role public.app_role;
  v_privileged_changed boolean;
BEGIN
  -- Service role / direct SQL (migrations, dashboard, edge functions): unrestricted.
  IF v_uid IS NULL OR COALESCE(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  v_privileged_changed :=
       NEW.role        IS DISTINCT FROM OLD.role
    OR NEW.active      IS DISTINCT FROM OLD.active
    OR NEW.site_access IS DISTINCT FROM OLD.site_access
    OR NEW.email       IS DISTINCT FROM OLD.email;

  IF NOT v_privileged_changed THEN
    RETURN NEW;
  END IF;

  -- Nobody may change their own role / active flag / site access / email.
  IF NEW.id = v_uid THEN
    RAISE EXCEPTION 'You cannot change your own role, active status, site access or email.'
      USING ERRCODE = '42501';
  END IF;

  SELECT role INTO v_caller_role FROM public.profiles WHERE id = v_uid;

  IF v_caller_role IS NULL OR v_caller_role NOT IN ('admin', 'owner', 'head_supervisor') THEN
    RAISE EXCEPTION 'Only admin, owner or head supervisor can change roles, active status or site access.'
      USING ERRCODE = '42501';
  END IF;

  -- The target's current and new role must both be within the caller's assignable set.
  IF NOT (OLD.role = ANY (public.assignable_roles_for(v_caller_role)))
     OR NOT (NEW.role = ANY (public.assignable_roles_for(v_caller_role))) THEN
    RAISE EXCEPTION 'Your role (%) is not allowed to manage a % account.', v_caller_role, OLD.role
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_protect_privileged_columns ON public.profiles;
CREATE TRIGGER profiles_protect_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- Belt and braces: anon must never write profiles at all.
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon;
