-- Business Executives / Sales Reps and Suppliers Migration

-- 1. Business Executives / Sales Reps table
CREATE TABLE IF NOT EXISTS public.business_executives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exec_code TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  mobile TEXT,
  email TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_business_executives_code ON public.business_executives(exec_code);
CREATE INDEX IF NOT EXISTS idx_business_executives_company_id ON public.business_executives(company_id);
CREATE INDEX IF NOT EXISTS idx_business_executives_status ON public.business_executives(status);

-- 2. Suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_code TEXT NOT NULL,
  supplier_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  payment_terms TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_code ON public.suppliers(supplier_code);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON public.suppliers(status);

-- 3. Enable RLS
ALTER TABLE public.business_executives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies - open access (same pattern as companies/locations)
DROP POLICY IF EXISTS "business_executives_open_access" ON public.business_executives;
CREATE POLICY "business_executives_open_access"
  ON public.business_executives FOR ALL TO public
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "suppliers_open_access" ON public.suppliers;
CREATE POLICY "suppliers_open_access"
  ON public.suppliers FOR ALL TO public
  USING (true) WITH CHECK (true);
