-- Drop extra columns from empties_types table
-- Keeping only: id, empties_code, empties_name, status, created_at, updated_at

ALTER TABLE public.empties_types
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS unit_cost,
  DROP COLUMN IF EXISTS deposit_amount,
  DROP COLUMN IF EXISTS capacity,
  DROP COLUMN IF EXISTS uom;
