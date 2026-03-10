-- Add location_manager_id to locations table (FK to business_executives)
ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS location_manager_id UUID REFERENCES public.business_executives(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_locations_manager_id ON public.locations(location_manager_id);

-- Rename inventory_enabled to enable_inventory if it doesn't exist yet
-- (inventory_enabled already exists, add enable_inventory as alias or just use inventory_enabled)
-- The UI will use inventory_enabled column directly
