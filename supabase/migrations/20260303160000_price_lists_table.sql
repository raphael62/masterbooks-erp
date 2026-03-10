-- Price Lists table for import feature
CREATE TABLE IF NOT EXISTS public.price_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_code TEXT NOT NULL,
  price_list_name TEXT NOT NULL,
  customer_type TEXT,
  product_code TEXT,
  product_name TEXT,
  unit_price NUMERIC DEFAULT 0,
  min_quantity NUMERIC DEFAULT 0,
  max_quantity NUMERIC DEFAULT 0,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_price_lists_code ON public.price_lists(price_list_code);
CREATE INDEX IF NOT EXISTS idx_price_lists_company_id ON public.price_lists(company_id);

ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "price_lists_open_access" ON public.price_lists;
CREATE POLICY "price_lists_open_access"
  ON public.price_lists
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
