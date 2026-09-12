-- =============================================================================
-- Notifications: admin/owner can read ALL (first user to all notification).
-- Permissions taken from users (profiles) via current_user_role().
-- Push tokens table for real-time mobile push notifications.
-- =============================================================================

-- 1) Admin and owner can read all notifications (management sees everything)
DROP POLICY IF EXISTS "Users read own role notifications" ON public.notifications;
CREATE POLICY "Users read own role notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (
    target_role = (public.current_user_role())::text
    OR (public.current_user_role()) IN ('admin', 'owner')
  );

-- 2) Push tokens: one row per device; used to send Expo push when notification inserted
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expo_push_token text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, expo_push_token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own push tokens (permissions from user = auth.uid())
DROP POLICY IF EXISTS "Users manage own push tokens" ON public.push_tokens;
CREATE POLICY "Users manage own push tokens"
  ON public.push_tokens FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3) Realtime for push_tokens not needed (server sends push; app uses Realtime on notifications)
