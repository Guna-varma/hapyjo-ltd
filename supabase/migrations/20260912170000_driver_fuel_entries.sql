-- ---------------------------------------------------------------------------
-- P1 FIX: driver fuel entries silently never persisted
--
-- Findings (verified live as the test truck driver):
--   * "Fuel filled at start" on Start trip called UPDATE vehicles … but drivers have
--     no UPDATE policy on vehicles, so PostgREST updated 0 rows; the UI showed the
--     new balance optimistically and it vanished on the next refetch.
--   * "Pause & refuel" inserted a fuel expense, but only assistant supervisors may
--     insert expenses; the RLS error was treated as "offline", the row went into the
--     device's offline queue forever and was shown locally as if saved.
-- Both flows exist in the original mobile app, so the intended rule is that a
-- driver CAN record fuel for the vehicle they are operating. This migration makes
-- the database allow exactly that and nothing more.
--
--   1. driver_record_fuel_at_start(vehicle, litres): SECURITY DEFINER RPC that adds
--      litres to vehicles.fuel_balance_litre for a vehicle the caller (a driver /
--      operator) is assigned to (driver_vehicle_assignments or an assigned trip).
--   2. RLS: drivers may INSERT type='fuel' expenses for a vehicle they are assigned
--      to, on a site they are assigned to. The existing on_expense_insert trigger
--      then credits the vehicle balance and the site's spent, exactly as for an
--      assistant supervisor's fuel entry.
-- Additive; no existing rows are modified.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.driver_is_assigned_vehicle(p_driver_id uuid, p_vehicle_id text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.driver_vehicle_assignments d
    WHERE d.driver_id = p_driver_id AND p_vehicle_id = ANY (d.vehicle_ids)
  ) OR EXISTS (
    SELECT 1 FROM public.assigned_trips a
    WHERE a.driver_id = p_driver_id AND a.vehicle_id = p_vehicle_id
  ) OR EXISTS (
    SELECT 1 FROM public.sites s
    WHERE p_driver_id = ANY (s.driver_ids) AND p_vehicle_id = ANY (s.vehicle_ids)
  );
$$;

CREATE OR REPLACE FUNCTION public.driver_record_fuel_at_start(p_vehicle_id text, p_litres numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
  v_balance numeric;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501';
  END IF;
  v_role := public.current_user_role()::text;
  IF v_role NOT IN ('driver_truck', 'driver_machine') THEN
    RAISE EXCEPTION 'only drivers and operators record fuel at trip start' USING ERRCODE = '42501';
  END IF;
  IF p_litres IS NULL OR p_litres <= 0 OR p_litres > 10000 THEN
    RAISE EXCEPTION 'litres must be between 0 and 10000';
  END IF;
  IF NOT public.driver_is_assigned_vehicle(v_uid, p_vehicle_id) THEN
    RAISE EXCEPTION 'you are not assigned to this vehicle' USING ERRCODE = '42501';
  END IF;

  UPDATE public.vehicles
  SET fuel_balance_litre = COALESCE(fuel_balance_litre, 0) + round(p_litres::numeric, 2)
  WHERE id = p_vehicle_id
  RETURNING fuel_balance_litre INTO v_balance;

  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'vehicle not found';
  END IF;
  RETURN v_balance;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.driver_record_fuel_at_start(text, numeric) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.driver_record_fuel_at_start(text, numeric) TO authenticated;

-- Drivers may record a fuel expense for the vehicle they operate, on their own site.
DROP POLICY IF EXISTS "Driver insert fuel expense for assigned vehicle" ON public.expenses;
CREATE POLICY "Driver insert fuel expense for assigned vehicle" ON public.expenses
  FOR INSERT TO authenticated
  WITH CHECK (
    public.current_user_role() IN ('driver_truck', 'driver_machine')
    AND type = 'fuel'
    AND vehicle_id IS NOT NULL
    AND public.driver_is_assigned_vehicle(auth.uid(), vehicle_id)
    AND site_id IN (SELECT sa.site_id FROM public.site_assignments sa WHERE sa.user_id = auth.uid())
  );
