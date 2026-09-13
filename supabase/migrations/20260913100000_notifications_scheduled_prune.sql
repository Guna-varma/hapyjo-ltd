-- ---------------------------------------------------------------------------
-- P2: notifications grow without bound (~50-100 rows/day). Nothing scheduled the
-- prune. This adds pg_cron and a nightly job:
--   * read notifications older than 7 days are removed
--   * anything older than 30 days is removed (read or not)
-- Only public.notifications (Hapyjo) is touched.
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

CREATE OR REPLACE FUNCTION public.prune_notifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  deleted_count integer;
BEGIN
  WITH deleted AS (
    DELETE FROM public.notifications
    WHERE (read = true AND created_at < now() - interval '7 days')
       OR created_at < now() - interval '30 days'
    RETURNING id
  )
  SELECT count(*)::integer INTO deleted_count FROM deleted;
  RETURN deleted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.prune_notifications() FROM PUBLIC, anon, authenticated;

-- Idempotent: replace any previous schedule with the same name.
DO $$
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'hapyjo_prune_notifications';
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;
SELECT cron.schedule('hapyjo_prune_notifications', '20 2 * * *', $$SELECT public.prune_notifications();$$);
