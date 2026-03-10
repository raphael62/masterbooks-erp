-- Multi-Company Multi-Location Migration
-- Creates companies, locations tables and links them to existing data

-- 1. Companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  registration_number TEXT,
  tin_number TEXT,
  vat_number TEXT,
  address TEXT,
  city TEXT,
  region TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_code ON public.companies(code);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON public.companies(is_active);

-- 2. Locations table (linked to companies)
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  location_type TEXT DEFAULT 'branch',
  address TEXT,
  city TEXT,
  phone TEXT,
  manager TEXT,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  inventory_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_locations_company_code ON public.locations(company_id, code);
CREATE INDEX IF NOT EXISTS idx_locations_company_id ON public.locations(company_id);
CREATE INDEX IF NOT EXISTS idx_locations_is_active ON public.locations(is_active);

-- 3. Add company_id and location_id to customers table
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_customers_company_id ON public.customers(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_location_id ON public.customers(location_id);

-- 4. Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies - open access for now (same pattern as customers)
DROP POLICY IF EXISTS "companies_open_access" ON public.companies;
CREATE POLICY "companies_open_access"
  ON public.companies FOR ALL TO public
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "locations_open_access" ON public.locations;
CREATE POLICY "locations_open_access"
  ON public.locations FOR ALL TO public
  USING (true) WITH CHECK (true);

-- 6. Seed default company and locations
DO $$
DECLARE
  default_company_id UUID := gen_random_uuid();
  main_location_id UUID := gen_random_uuid();
  tema_location_id UUID := gen_random_uuid();
BEGIN
  -- Insert default company
  INSERT INTO public.companies (
    id, name, code, registration_number, tin_number,
    address, city, region, phone, email, website,
    is_active, is_default
  ) VALUES (
    default_company_id,
    'MasterBooks Distribution Ltd',
    'MBD',
    'CS-123456789',
    'C0012345678901',
    'Plot 45, Industrial Area',
    'Accra',
    'Greater Accra',
    '+233 24 123 4567',
    'info@masterbooks.gh',
    'www.masterbooks.gh',
    true,
    true
  ) ON CONFLICT DO NOTHING;

  -- Insert default locations for the company
  INSERT INTO public.locations (
    id, company_id, name, code, location_type,
    address, phone, manager, is_active, is_default, inventory_enabled
  ) VALUES
  (
    main_location_id,
    default_company_id,
    'Main Warehouse',
    'MW001',
    'warehouse',
    'Industrial Area, Accra',
    '+233 24 123 4567',
    'Kwame Asante',
    true,
    true,
    true
  ),
  (
    tema_location_id,
    default_company_id,
    'Tema Branch',
    'TB002',
    'branch',
    'Tema Community 1',
    '+233 24 234 5678',
    'Ama Serwaa',
    true,
    false,
    true
  )
  ON CONFLICT DO NOTHING;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Seed data insertion failed: %', SQLERRM;
END $$;
