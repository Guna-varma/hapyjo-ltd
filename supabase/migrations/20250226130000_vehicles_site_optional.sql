-- Vehicles: site is optional (not mandatory). Free vehicles have no site and can be allocated to any site later.
ALTER TABLE public.vehicles
  ALTER COLUMN site_id DROP NOT NULL;

COMMENT ON COLUMN public.vehicles.site_id IS 'Optional. NULL = free vehicle (not assigned to a site).';
