-- Vendors Table Migration
-- Creates the vendors table required by the Vendor Management module

CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_code TEXT,
  vendor_name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Ghana',
  payment_terms TEXT DEFAULT 'net30',
  credit_limit NUMERIC DEFAULT 0,
  outstanding_balance NUMERIC DEFAULT 0,
  tax_id TEXT,
  bank_name TEXT,
  bank_account TEXT,
  category TEXT DEFAULT 'supplier',
  status TEXT DEFAULT 'active',
  notes TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vendors_vendor_name ON public.vendors(vendor_name);
CREATE INDEX IF NOT EXISTS idx_vendors_status ON public.vendors(status);
CREATE INDEX IF NOT EXISTS idx_vendors_category ON public.vendors(category);
CREATE INDEX IF NOT EXISTS idx_vendors_company_id ON public.vendors(company_id);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vendors_open_access" ON public.vendors;
CREATE POLICY "vendors_open_access"
  ON public.vendors
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Sample vendor data
DO $$
BEGIN
  INSERT INTO public.vendors (id, vendor_code, vendor_name, contact_person, phone, email, payment_terms, credit_limit, outstanding_balance, status, category)
  VALUES
    (gen_random_uuid(), 'V001', 'Accra Beverages Ltd', 'Kwame Asante', '+233 24 123 4567', 'kwame@accrabev.com', 'net30', 500000, 125000, 'active', 'supplier'),
    (gen_random_uuid(), 'V002', 'Ghana Supplies Co.', 'Ama Owusu', '+233 20 987 6543', 'ama@ghanasupplies.com', 'net60', 300000, 78500, 'active', 'distributor'),
    (gen_random_uuid(), 'V003', 'West Africa Traders', 'Kofi Mensah', '+233 26 456 7890', 'kofi@watrade.com', 'cod', 200000, 0, 'active', 'manufacturer'),
    (gen_random_uuid(), 'V004', 'Kumasi Distributors', 'Abena Boateng', '+233 24 321 0987', 'abena@kumasidist.com', 'net30', 150000, 45000, 'active', 'distributor'),
    (gen_random_uuid(), 'V005', 'Northern Goods Ltd', 'Yaw Darko', '+233 20 654 3210', 'yaw@northerngoods.com', 'net90', 100000, 22000, 'inactive', 'supplier')
  ON CONFLICT (id) DO NOTHING;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Sample vendor data insertion skipped: %', SQLERRM;
END $$;
