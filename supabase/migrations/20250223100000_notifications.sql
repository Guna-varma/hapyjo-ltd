-- In-app notifications: one row per target role (or user). Recipients see notifications where target_role = their role.
CREATE TABLE IF NOT EXISTS public.notifications (
  id text NOT NULL PRIMARY KEY,
  target_role text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  read boolean NOT NULL DEFAULT false,
  link_id text,
  link_type text
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read notifications targeted at their role (uses current_user_role from RLS fix migration)
-- Cast app_role to text for comparison with target_role column
CREATE POLICY "Users read own role notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (target_role = (public.current_user_role())::text);

-- Allow management and drivers/assistant_supervisor to insert (e.g. when issue is raised)
CREATE POLICY "Insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK ((public.current_user_role())::text IN ('admin', 'owner', 'head_supervisor', 'assistant_supervisor', 'driver_truck', 'driver_machine'));

-- Allow users to update (mark read) their own notifications
CREATE POLICY "Users update own role notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (target_role = (public.current_user_role())::text)
  WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
