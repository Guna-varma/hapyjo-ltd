-- ---------------------------------------------------------------------------
-- P1 SECURITY FIX: a surveyor could approve their own survey
--
-- Finding (verified live as the test surveyor after the earlier fixes):
--   UPDATE surveys SET status = 'approved' WHERE surveyor_id = auth.uid()  -> succeeded
-- because "Surveyor update own surveys" has WITH CHECK (true), and the INSERT policy
-- lets a surveyor insert a row that is already 'approved'. An approved survey feeds
-- sites.total_excavated_m3 (and the owner/accountant revenue figures), so this let
-- a surveyor bypass the assistant supervisor's review entirely.
--
-- Rule enforced (mirrors the app: SurveysScreen + lib/rbac):
--   surveyor            : may create / revise ONLY as 'approval_pending', never sets
--                         approved_by_id / approved_at, may not touch an approved survey,
--                         may not change surveyor_id.
--   assistant supervisor: approve / reject (status + approved_by_id / approved_at) only —
--                         may not alter the surveyed values.
--   service_role / SQL  : unrestricted.
-- Additive; no rows modified.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_survey_approval_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
BEGIN
  IF v_uid IS NULL OR COALESCE(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;
  v_role := public.current_user_role()::text;

  IF v_role = 'surveyor' THEN
    IF NEW.status <> 'approval_pending' OR NEW.approved_by_id IS NOT NULL OR NEW.approved_at IS NOT NULL THEN
      RAISE EXCEPTION 'Surveys are approved or rejected by the assistant supervisor.' USING ERRCODE = '42501';
    END IF;
    IF TG_OP = 'UPDATE' THEN
      IF OLD.status = 'approved' THEN
        RAISE EXCEPTION 'An approved survey can no longer be changed.' USING ERRCODE = '42501';
      END IF;
      IF NEW.surveyor_id IS DISTINCT FROM OLD.surveyor_id OR NEW.site_id IS DISTINCT FROM OLD.site_id THEN
        RAISE EXCEPTION 'The surveyor and site of a survey cannot be changed.' USING ERRCODE = '42501';
      END IF;
    END IF;
  ELSIF v_role = 'assistant_supervisor' THEN
    IF TG_OP = 'UPDATE' THEN
      IF NEW.volume_m3 IS DISTINCT FROM OLD.volume_m3
      OR NEW.survey_date IS DISTINCT FROM OLD.survey_date
      OR NEW.surveyor_id IS DISTINCT FROM OLD.surveyor_id
      OR NEW.site_id IS DISTINCT FROM OLD.site_id THEN
        RAISE EXCEPTION 'Reviewers can only approve or reject a survey, not change its values.' USING ERRCODE = '42501';
      END IF;
      IF NEW.status = 'approved' AND NEW.approved_by_id IS DISTINCT FROM v_uid THEN
        NEW.approved_by_id := v_uid;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS surveys_enforce_approval_roles ON public.surveys;
CREATE TRIGGER surveys_enforce_approval_roles
  BEFORE INSERT OR UPDATE ON public.surveys
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_survey_approval_roles();
