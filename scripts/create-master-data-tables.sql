-- Run this in Supabase Dashboard → SQL Editor to create the missing tables
-- Master Data Lookup Tables: location_types, customer_groups, customer_types

CREATE TABLE IF NOT EXISTS public.location_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.customer_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.customer_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.location_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_types ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.location_types TO anon, authenticated, service_role;
GRANT ALL ON public.customer_groups TO anon, authenticated, service_role;
GRANT ALL ON public.customer_types TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "location_types_open_access" ON public.location_types;
CREATE POLICY "location_types_open_access" ON public.location_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "location_types_anon" ON public.location_types FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "customer_groups_open_access" ON public.customer_groups;
CREATE POLICY "customer_groups_open_access" ON public.customer_groups FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "customer_groups_anon" ON public.customer_groups FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "customer_types_open_access" ON public.customer_types;
CREATE POLICY "customer_types_open_access" ON public.customer_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "customer_types_anon" ON public.customer_types FOR ALL TO anon USING (true) WITH CHECK (true);

-- Seed common values
INSERT INTO public.location_types (code, name, description, status) VALUES
  ('warehouse', 'Warehouse', 'Main storage facility', 'active'),
  ('branch', 'Branch', 'Branch office or outlet', 'active'),
  ('shop', 'Shop', 'Retail shop', 'active'),
  ('depot', 'Depot', 'Distribution depot', 'active')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.customer_groups (code, name, description, status) VALUES
  ('RETAIL', 'Retail', 'Retail customers', 'active'),
  ('WHOLESALE', 'Wholesale', 'Wholesale customers', 'active'),
  ('HORECA', 'HoReCa', 'Hotels, Restaurants, Catering', 'active'),
  ('INSTITUTIONAL', 'Institutional', 'Schools, hospitals, etc.', 'active')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.customer_types (code, name, description, status) VALUES
  ('RETAILER', 'Retailer', 'Retail store', 'active'),
  ('WHOLESALER', 'Wholesaler', 'Wholesale distributor', 'active'),
  ('SUPERMARKET', 'Supermarket', 'Supermarket chain', 'active'),
  ('HOTEL', 'Hotel', 'Hotel establishment', 'active'),
  ('RESTAURANT', 'Restaurant', 'Restaurant/Caterer', 'active'),
  ('KIOSK', 'Kiosk', 'Small kiosk outlet', 'active')
ON CONFLICT (code) DO NOTHING;
