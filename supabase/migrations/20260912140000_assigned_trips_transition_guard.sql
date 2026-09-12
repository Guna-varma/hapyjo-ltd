-- ---------------------------------------------------------------------------
-- P1 FIX: enforce the assigned-trip / task lifecycle in the database
--
-- Finding: the lifecycle (lib/tripLifecycle.ts) was enforced only in the client.
-- The RLS policy "Driver update own assigned_trips" lets a driver UPDATE any
-- column of their own row, so with a direct API call a driver could:
--   * jump TRIP_ASSIGNED -> TRIP_COMPLETED (skipping the assistant supervisor's
--     approval and the fuel ledger entirely),
--   * write their own start/end readings, fuel_used_l, validated_by, ...
--
-- Fix: a BEFORE UPDATE trigger mirroring lib/tripLifecycle exactly:
--   driver/operator : ASSIGNED->STARTED, STARTED->PAUSED|NEED_APPROVAL,
--                     PAUSED->RESUMED|NEED_APPROVAL, RESUMED->PAUSED|NEED_APPROVAL,
--                     IN_PROGRESS->NEED_APPROVAL   (same TRIP_/TASK_ prefix only)
--   assistant sup.  : NEED_APPROVAL->COMPLETED
-- and drivers may not touch approval / identity columns. The SECURITY DEFINER
-- RPC approve_assigned_trip_readings runs with the assistant supervisor's
-- auth.uid(), so it passes the same check. service_role / direct SQL bypass.
-- Additive, no data change.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_assigned_trip_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
  v_from_prefix text;
  v_to_prefix text;
  v_from text;
  v_to text;
  v_allowed boolean := false;
BEGIN
  IF v_uid IS NULL OR COALESCE(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  v_role := public.current_user_role()::text;

  IF v_role IN ('driver_truck', 'driver_machine') THEN
    IF OLD.driver_id <> v_uid THEN
      RAISE EXCEPTION 'You can only update your own trips.' USING ERRCODE = '42501';
    END IF;
    IF NEW.driver_id           IS DISTINCT FROM OLD.driver_id
    OR NEW.vehicle_id          IS DISTINCT FROM OLD.vehicle_id
    OR NEW.site_id             IS DISTINCT FROM OLD.site_id
    OR NEW.vehicle_type        IS DISTINCT FROM OLD.vehicle_type
    OR NEW.created_by          IS DISTINCT FROM OLD.created_by
    OR NEW.created_at          IS DISTINCT FROM OLD.created_at
    OR NEW.start_reading       IS DISTINCT FROM OLD.start_reading
    OR NEW.end_reading         IS DISTINCT FROM OLD.end_reading
    OR NEW.distance_km         IS DISTINCT FROM OLD.distance_km
    OR NEW.hours_used          IS DISTINCT FROM OLD.hours_used
    OR NEW.fuel_used_l         IS DISTINCT FROM OLD.fuel_used_l
    OR NEW.validated_by        IS DISTINCT FROM OLD.validated_by
    OR NEW.validated_at        IS DISTINCT FROM OLD.validated_at
    OR NEW.validation_notes    IS DISTINCT FROM OLD.validation_notes
    OR NEW.manual_fuel_override_l IS DISTINCT FROM OLD.manual_fuel_override_l
    OR NEW.override_reason     IS DISTINCT FROM OLD.override_reason
    OR NEW.completed_at        IS DISTINCT FROM OLD.completed_at
    OR NEW.completed_by        IS DISTINCT FROM OLD.completed_by
    OR NEW.evidence_expires_at IS DISTINCT FROM OLD.evidence_expires_at
    OR NEW.evidence_deleted_at IS DISTINCT FROM OLD.evidence_deleted_at
    THEN
      RAISE EXCEPTION 'Drivers cannot change trip readings, approval or assignment fields.' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  v_from_prefix := split_part(OLD.status, '_', 1);
  v_to_prefix   := split_part(NEW.status, '_', 1);
  v_from := substr(OLD.status, length(v_from_prefix) + 2);
  v_to   := substr(NEW.status, length(v_to_prefix) + 2);

  IF v_from_prefix <> v_to_prefix OR v_from_prefix NOT IN ('TRIP', 'TASK') THEN
    RAISE EXCEPTION 'Invalid status transition % -> %', OLD.status, NEW.status USING ERRCODE = '23514';
  END IF;

  IF v_role IN ('driver_truck', 'driver_machine') THEN
    v_allowed :=
         (v_from = 'ASSIGNED'    AND v_to = 'STARTED')
      OR (v_from = 'STARTED'     AND v_to IN ('PAUSED', 'NEED_APPROVAL'))
      OR (v_from = 'PAUSED'      AND v_to IN ('RESUMED', 'NEED_APPROVAL'))
      OR (v_from = 'RESUMED'     AND v_to IN ('PAUSED', 'NEED_APPROVAL'))
      OR (v_from = 'IN_PROGRESS' AND v_to = 'NEED_APPROVAL');
  ELSIF v_role = 'assistant_supervisor' THEN
    v_allowed := (v_from = 'NEED_APPROVAL' AND v_to = 'COMPLETED');
  END IF;

  IF NOT v_allowed THEN
    RAISE EXCEPTION 'Status transition % -> % is not allowed for %', OLD.status, NEW.status, v_role
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assigned_trips_enforce_transition ON public.assigned_trips;
CREATE TRIGGER assigned_trips_enforce_transition
  BEFORE UPDATE ON public.assigned_trips
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_assigned_trip_transition();
