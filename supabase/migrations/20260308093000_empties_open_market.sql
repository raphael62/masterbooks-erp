-- Migration: Open Market Empties Purchase tables
-- Timestamp: 20260308093000

-- empties_open_market_header
CREATE TABLE IF NOT EXISTS public.empties_open_market_header (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_no TEXT NOT NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  supplier_name TEXT,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  location_name TEXT,
  notes TEXT,
  total_value NUMERIC(14,2) DEFAULT 0,
  status TEXT DEFAULT 'posted',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_eomp_header_purchase_date ON public.empties_open_market_header(purchase_date);
CREATE INDEX IF NOT EXISTS idx_eomp_header_location_id ON public.empties_open_market_header(location_id);

-- empties_open_market_items
CREATE TABLE IF NOT EXISTS public.empties_open_market_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  header_id UUID NOT NULL REFERENCES public.empties_open_market_header(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_code TEXT,
  product_name TEXT,
  empties_type TEXT,
  qty NUMERIC(14,4) DEFAULT 0,
  unit_price NUMERIC(14,4) DEFAULT 0,
  total_value NUMERIC(14,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_eomp_items_header_id ON public.empties_open_market_items(header_id);

-- Enable RLS
ALTER TABLE public.empties_open_market_header ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empties_open_market_items ENABLE ROW LEVEL SECURITY;

-- Open access RLS policies
DROP POLICY IF EXISTS "open_access_empties_open_market_header" ON public.empties_open_market_header;
CREATE POLICY "open_access_empties_open_market_header"
ON public.empties_open_market_header
FOR ALL
TO public
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "open_access_empties_open_market_items" ON public.empties_open_market_items;
CREATE POLICY "open_access_empties_open_market_items"
ON public.empties_open_market_items
FOR ALL
TO public
USING (true)
WITH CHECK (true);
