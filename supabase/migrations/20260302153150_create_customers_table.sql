-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  business_name TEXT,
  price_type TEXT,
  mobile TEXT,
  email TEXT,
  business_address TEXT,
  call_days TEXT,
  customer_type TEXT,
  business_executive TEXT,
  credit_limit NUMERIC DEFAULT 0,
  location TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_customer_code ON public.customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_customer_name ON public.customers(customer_name);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "customers_open_access" ON public.customers;
CREATE POLICY "customers_open_access"
  ON public.customers
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
