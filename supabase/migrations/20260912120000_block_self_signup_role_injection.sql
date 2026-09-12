-- ---------------------------------------------------------------------------
-- P0 SECURITY FIX: self-registration with a client-chosen role
--
-- Finding (verified against production with the anon key):
--   supabase.auth.signUp({ email, password, options: { data: { role: 'owner' } } })
-- created a confirmed auth user AND an ACTIVE profile with role = 'owner',
-- because public sign-up is enabled in Auth settings and handle_new_user()
-- trusted raw_user_meta_data.role (which any client can set).
--
-- Fix (defence in depth — ALSO disable "Allow new users to sign up" in
-- Supabase Dashboard > Authentication > Sign In / Providers > Email):
--   handle_new_user() now only honours a role for accounts provisioned by the
--   trusted server path, identified by app_metadata.provisioned_by =
--   'hapyjo_admin'. app_metadata can only be written with the service-role key
--   (the create_user_by_owner Edge Function), never by a browser client.
--   Any other insert into auth.users (public sign-up) is rejected outright, so
--   no auth account and no profile row is created.
--
-- Additive: no existing rows are touched. Requires the create_user_by_owner
-- Edge Function deployed at the same time (it sets app_metadata.provisioned_by).
-- ---------------------------------------------------------------------------

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
  -- Only the trusted server-side provisioning path may create accounts.
  IF COALESCE(NEW.raw_app_meta_data->>'provisioned_by', '') <> 'hapyjo_admin' THEN
    RAISE EXCEPTION 'Self-registration is disabled. Accounts are created by an administrator.'
      USING ERRCODE = '42501';
  END IF;

  meta_role := NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), '');
  IF meta_role IN ('admin', 'owner', 'head_supervisor', 'accountant', 'assistant_supervisor', 'surveyor', 'driver_truck', 'driver_machine') THEN
    assign_role := meta_role::public.app_role;
  ELSE
    assign_role := 'driver_truck'::public.app_role;
  END IF;

  INSERT INTO public.profiles (id, name, email, role, site_access, active)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''), split_part(NEW.email, '@', 1)),
    NEW.email,
    assign_role,
    '{}',
    COALESCE((NEW.raw_user_meta_data->>'active')::boolean, true)
  );
  RETURN NEW;
END;
$function$;
