-- ---------------------------------------------------------------------------
-- P2 DATA-INTEGRITY FIX: deleting an expense left sites.spent (and the vehicle
-- fuel balance for fuel expenses) permanently inflated.
--
-- on_expense_insert() adds amount_rwf / fuel_cost to sites.spent and litres to
-- vehicles.fuel_balance_litre, but nothing reversed those on DELETE. The Expenses
-- screen lets an assistant supervisor delete an expense, so every deletion
-- drifted the site's "Spent" figure (verified live: insert 1,000 RWF + delete
-- left e2e_site_alpha.spent +1,000).
--
-- Fix: an AFTER DELETE trigger applying the exact inverse of the insert trigger
-- (never below zero). Additive; existing rows are not modified.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.on_expense_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  sub_spent bigint;
  sub_litres numeric(12,2);
BEGIN
  IF OLD.type = 'general' THEN
    sub_spent := COALESCE(OLD.amount_rwf, 0);
    UPDATE public.sites SET spent = GREATEST(0, spent - sub_spent) WHERE id = OLD.site_id;
  ELSIF OLD.type = 'fuel' THEN
    sub_spent := COALESCE(OLD.fuel_cost, 0);
    sub_litres := COALESCE(OLD.litres, 0);
    UPDATE public.sites SET spent = GREATEST(0, spent - sub_spent) WHERE id = OLD.site_id;
    IF OLD.vehicle_id IS NOT NULL AND sub_litres > 0 THEN
      UPDATE public.vehicles SET fuel_balance_litre = GREATEST(0, fuel_balance_litre - sub_litres) WHERE id = OLD.vehicle_id;
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS after_expense_delete ON public.expenses;
CREATE TRIGGER after_expense_delete
  AFTER DELETE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.on_expense_delete();
