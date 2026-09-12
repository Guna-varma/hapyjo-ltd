-- Allow users to delete (clear) their own role notifications. Used by "Clear all notifications" – hard delete in DB.
CREATE POLICY "Users delete own role notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (target_role = (public.current_user_role())::text);
