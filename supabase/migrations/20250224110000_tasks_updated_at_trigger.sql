-- =============================================================================
-- Tasks: auto-set updated_at on UPDATE (same pattern as profiles).
-- Uses existing set_updated_at() function.
-- =============================================================================

DROP TRIGGER IF EXISTS tasks_updated_at ON public.tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
