-- Migration: Fix price_types table (re-create with higher timestamp)
-- Timestamp: 20260303200000

-- Create price_types table (idempotent)
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

-- Enable RLS
ALTER TABLE public.price_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "price_types_open_access" ON public.price_types;
CREATE POLICY "price_types_open_access"
  ON public.price_types FOR ALL TO public
  USING (true) WITH CHECK (true);
