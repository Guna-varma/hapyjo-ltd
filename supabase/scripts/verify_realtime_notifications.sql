-- =============================================================================
-- Real-time notifications: verification script
-- Run in Supabase SQL Editor. Ensures schema and replication are correct.
-- Notifications are created in real time by the app (issues, trips, expenses,
-- surveys, reports, etc.) and by Edge Function (push). This script does NOT
-- insert demo data.
-- =============================================================================

-- 1) Notifications table must exist and be in realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    RAISE NOTICE 'Added public.notifications to supabase_realtime publication.';
  ELSE
    RAISE NOTICE 'public.notifications is already in supabase_realtime.';
  END IF;
END $$;

-- 2) push_tokens table must exist for push delivery (migration 20250301100000)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'push_tokens'
  ) THEN
    RAISE WARNING 'Table public.push_tokens not found. Run migration 20250301100000_notifications_admin_all_and_push_tokens.sql.';
  ELSE
    RAISE NOTICE 'public.push_tokens exists.';
  END IF;
END $$;

-- 3) current_user_role() must exist (used by RLS on notifications)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'current_user_role'
  ) THEN
    RAISE WARNING 'Function public.current_user_role() not found. Run RLS migration (20250222110000).';
  ELSE
    RAISE NOTICE 'public.current_user_role() exists.';
  END IF;
END $$;

-- =============================================================================
-- Optional: smoke test real-time + push (run once, then delete the row)
-- Uncomment and run to verify that inserting a row triggers Realtime and
-- (if webhook is set) the send-push-on-notification Edge Function.
-- Replace 'head_supervisor' with a role that exists in your profiles.
-- =============================================================================
/*
INSERT INTO public.notifications (id, target_role, title, body, created_at, read)
VALUES (
  gen_random_uuid()::text,
  'head_supervisor',
  'Real-time test',
  'If you see this in the app and on your device, real-time and push are working.',
  now(),
  false
);
-- After verifying, remove the row:
-- DELETE FROM public.notifications WHERE title = 'Real-time test' AND body LIKE 'If you see this%';
*/
