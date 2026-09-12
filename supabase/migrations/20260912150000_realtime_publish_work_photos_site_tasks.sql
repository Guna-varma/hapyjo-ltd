-- ---------------------------------------------------------------------------
-- P1 REALTIME FIX: work_photos and site_tasks were never published
--
-- Finding: the supabase_realtime publication contained every store table except
-- work_photos and site_tasks, so a work-progress photo captured by a surveyor /
-- assistant supervisor / driver, and a site task progress change (which drives
-- sites.progress), never reached other users' screens live.
--
-- Verified live: Realtime also rejects a channel's whole postgres_changes
-- subscription if it names a table that is not in the publication, so the client
-- subscribes to these two tables on a separate channel.
--
-- Additive: adds the two tables to the existing publication (no-op if present).
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'work_photos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.work_photos;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'site_tasks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.site_tasks;
  END IF;
END $$;
