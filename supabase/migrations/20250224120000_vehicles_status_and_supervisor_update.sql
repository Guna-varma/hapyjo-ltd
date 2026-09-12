-- Vehicles: add status (active/inactive) for soft delete; head_supervisor and assistant_supervisor must not hard delete.
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'inactive'));

-- Assistant supervisor: can UPDATE vehicles (edit details, set active/inactive) but not INSERT or DELETE.
CREATE POLICY "Assistant supervisor update vehicles"
  ON public.vehicles FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'assistant_supervisor')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'assistant_supervisor');

-- Head supervisor: ensure they can update (already in "Admin owner head_supervisor write vehicles" which is FOR ALL).

-- Head supervisor can also assign drivers to vehicles (bidirectional: see free vehicles and assign).
CREATE POLICY "Head supervisor write driver_vehicle_assignments"
  ON public.driver_vehicle_assignments FOR ALL
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'head_supervisor')
  WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'head_supervisor');
