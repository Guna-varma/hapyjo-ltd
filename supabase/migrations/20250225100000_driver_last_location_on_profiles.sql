-- Driver last-known position when not on an active trip (updated every time driver opens app / Driver Trips screen)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_lat numeric(10,6),
  ADD COLUMN IF NOT EXISTS last_lon numeric(10,6),
  ADD COLUMN IF NOT EXISTS location_updated_at timestamptz;

COMMENT ON COLUMN public.profiles.last_lat IS 'Last known latitude (driver); updated on login/screen focus when not on a trip';
COMMENT ON COLUMN public.profiles.last_lon IS 'Last known longitude (driver); updated on login/screen focus when not on a trip';
COMMENT ON COLUMN public.profiles.location_updated_at IS 'When last_lat/last_lon were last updated';
