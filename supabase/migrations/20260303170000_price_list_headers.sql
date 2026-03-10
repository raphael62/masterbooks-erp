-- Price List Headers table for Price List Management screen
CREATE TABLE IF NOT EXISTS public.price_list_headers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_code TEXT NOT NULL,
  price_list_name TEXT NOT NULL,
  customer_type TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_price_list_headers_code ON public.price_list_headers(price_list_code);
CREATE INDEX IF NOT EXISTS idx_price_list_headers_company_id ON public.price_list_headers(company_id);

ALTER TABLE public.price_list_headers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "price_list_headers_open_access" ON public.price_list_headers;
CREATE POLICY "price_list_headers_open_access"
  ON public.price_list_headers
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Price List Items table for line items per header
CREATE TABLE IF NOT EXISTS public.price_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_header_id UUID REFERENCES public.price_list_headers(id) ON DELETE CASCADE,
  product_code TEXT,
  product_name TEXT NOT NULL,
  unit_of_measure TEXT DEFAULT 'Pieces',
  unit_price NUMERIC DEFAULT 0,
  min_qty NUMERIC DEFAULT 0,
  max_qty NUMERIC DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_price_list_items_header_id ON public.price_list_items(price_list_header_id);

ALTER TABLE public.price_list_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "price_list_items_open_access" ON public.price_list_items;
CREATE POLICY "price_list_items_open_access"
  ON public.price_list_items
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
