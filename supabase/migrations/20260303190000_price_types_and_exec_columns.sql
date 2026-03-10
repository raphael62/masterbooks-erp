-- Migration: Price Types table + Business Executives additional columns
-- Timestamp: 20260303190000

-- 1. Create price_types table
CREATE TABLE IF NOT EXISTS public.price_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_type_code TEXT NOT NULL,
  price_type_name TEXT NOT NULL,
  description TEXT,
  discount_percent NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_price_types_code ON public.price_types(price_type_code);
CREATE INDEX IF NOT EXISTS idx_price_types_status ON public.price_types(status);

-- 2. Add missing columns to business_executives
ALTER TABLE public.business_executives
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS location TEXT,
  ADD COLUMN IF NOT EXISTS target_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sales_ytd NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 0;

-- 3. Enable RLS on price_types
ALTER TABLE public.price_types ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
DROP POLICY IF EXISTS "price_types_open_access" ON public.price_types;
CREATE POLICY "price_types_open_access"
  ON public.price_types FOR ALL TO public
  USING (true) WITH CHECK (true);
