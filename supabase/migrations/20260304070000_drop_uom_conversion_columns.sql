-- Drop conversion_factor and base_unit columns from units_of_measure
-- These are handled at the product level via pack_unit field

ALTER TABLE public.units_of_measure
  DROP COLUMN IF EXISTS conversion_factor,
  DROP COLUMN IF EXISTS base_unit;
