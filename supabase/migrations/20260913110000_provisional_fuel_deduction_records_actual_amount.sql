-- ---------------------------------------------------------------------------
-- P3 ledger consistency: when a trip / machine session is completed by the driver
-- the trigger provisionally deducts the estimated fuel (clamped at 0). The later
-- assistant-supervisor approval (approve_assigned_trip_readings) reverses
-- `fuel_consumed` and applies the validated amount. If the clamp had cut the
-- deduction short, the reversal credited more than was ever deducted.
--
-- Fix: record in fuel_consumed exactly what was deducted, so the approval
-- reversal is always exact. Approval overwrites fuel_consumed with the validated
-- figure anyway, so nothing changes for approved records.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.on_machine_session_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  hrs_per_litre numeric(10,2);
  duration_hrs numeric(10,2);
  consumed numeric(12,2);
  balance numeric(12,2);
  deducted numeric(12,2);
BEGIN
  IF NEW.status <> 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;
  IF NEW.end_time IS NULL THEN
    RETURN NEW;
  END IF;
  duration_hrs := ROUND(EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 3600.0, 2);
  NEW.duration_hours := duration_hrs;
  SELECT v.hours_per_litre, COALESCE(v.fuel_balance_litre, 0)
    INTO hrs_per_litre, balance
    FROM public.vehicles v WHERE v.id = NEW.vehicle_id FOR UPDATE;
  IF hrs_per_litre IS NULL OR hrs_per_litre <= 0 THEN
    RETURN NEW;
  END IF;
  consumed := ROUND((duration_hrs / hrs_per_litre)::numeric, 2);
  -- Never below zero, and fuel_consumed is what was actually deducted.
  deducted := LEAST(consumed, GREATEST(balance, 0));
  NEW.fuel_consumed := deducted;
  UPDATE public.vehicles SET fuel_balance_litre = GREATEST(0, fuel_balance_litre - deducted) WHERE id = NEW.vehicle_id;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.on_trip_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  mileage numeric(10,2);
  consumed numeric(12,2);
  balance numeric(12,2);
  deducted numeric(12,2);
BEGIN
  IF NEW.status <> 'completed' OR OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;
  SELECT v.mileage_km_per_litre, COALESCE(v.fuel_balance_litre, 0)
    INTO mileage, balance
    FROM public.vehicles v WHERE v.id = NEW.vehicle_id FOR UPDATE;
  IF mileage IS NULL OR mileage <= 0 THEN
    RETURN NEW;
  END IF;
  consumed := ROUND((COALESCE(NEW.distance_km, 0) / mileage)::numeric, 2);
  deducted := LEAST(consumed, GREATEST(balance, 0));
  NEW.fuel_consumed := deducted;
  UPDATE public.vehicles SET fuel_balance_litre = GREATEST(0, fuel_balance_litre - deducted) WHERE id = NEW.vehicle_id;
  RETURN NEW;
END;
$function$;
