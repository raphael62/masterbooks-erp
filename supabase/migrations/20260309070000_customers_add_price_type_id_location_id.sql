-- Migration: Add price_type_id and location_id UUID FK columns to customers table
-- Backfill from existing text values where possible

-- 1. Add the new UUID FK columns (idempotent)
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS price_type_id UUID REFERENCES public.price_types(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;

-- 2. Create indexes for the new FK columns
CREATE INDEX IF NOT EXISTS idx_customers_price_type_id ON public.customers(price_type_id);
CREATE INDEX IF NOT EXISTS idx_customers_location_id ON public.customers(location_id);

-- 3. Backfill price_type_id from existing price_type text values
UPDATE public.customers c
SET price_type_id = pt.id
FROM public.price_types pt
WHERE c.price_type_id IS NULL
  AND c.price_type IS NOT NULL
  AND LOWER(pt.price_type_name) = LOWER(c.price_type);

-- 4. Backfill location_id from existing location text values
UPDATE public.customers c
SET location_id = l.id
FROM public.locations l
WHERE c.location_id IS NULL
  AND c.location IS NOT NULL
  AND LOWER(l.name) = LOWER(c.location);
