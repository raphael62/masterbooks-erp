-- Purchase Invoices Migration
-- Tables: purchase_invoices, purchase_invoice_items
-- Posting rule: Invoice date affects supplier accounts payable, Delivery date updates stocks

CREATE TABLE IF NOT EXISTS public.purchase_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no TEXT NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  location_name TEXT,
  invoice_date DATE DEFAULT CURRENT_DATE,
  delivery_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  payment_date DATE,
  pallet_qty NUMERIC DEFAULT 0,
  notes TEXT,
  transporter TEXT,
  driver_name TEXT,
  vehicle_no TEXT,
  supplier_inv_no TEXT,
  empties_inv_no TEXT,
  po_number TEXT,
  delivery_note TEXT,
  subtotal NUMERIC DEFAULT 0,
  total_tax_amt NUMERIC DEFAULT 0,
  total_pre_tax NUMERIC DEFAULT 0,
  total_tax_inc_value NUMERIC DEFAULT 0,
  total_empties_value NUMERIC DEFAULT 0,
  total_breakages_value NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft',
  posted_ap BOOLEAN DEFAULT false,
  posted_stock BOOLEAN DEFAULT false,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.purchase_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_invoice_id UUID REFERENCES public.purchase_invoices(id) ON DELETE CASCADE,
  item_code TEXT,
  item_name TEXT,
  pack_unit NUMERIC DEFAULT 0,
  btl_qty NUMERIC DEFAULT 0,
  ctn_qty NUMERIC DEFAULT 0,
  breakages_btl NUMERIC DEFAULT 0,
  breakages_value NUMERIC DEFAULT 0,
  price_ex_tax NUMERIC DEFAULT 0,
  pre_tax NUMERIC DEFAULT 0,
  tax_amt NUMERIC DEFAULT 0,
  price_tax_inc NUMERIC DEFAULT 0,
  tax_inc_value NUMERIC DEFAULT 0,
  empties_value NUMERIC DEFAULT 0,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_supplier_id ON public.purchase_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_invoice_date ON public.purchase_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_status ON public.purchase_invoices(status);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_company_id ON public.purchase_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_invoice_id ON public.purchase_invoice_items(purchase_invoice_id);

-- Enable RLS
ALTER TABLE public.purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_invoice_items ENABLE ROW LEVEL SECURITY;

-- Open access RLS policies (matching existing pattern)
DROP POLICY IF EXISTS "open_access_purchase_invoices" ON public.purchase_invoices;
CREATE POLICY "open_access_purchase_invoices" ON public.purchase_invoices FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "open_access_purchase_invoice_items" ON public.purchase_invoice_items;
CREATE POLICY "open_access_purchase_invoice_items" ON public.purchase_invoice_items FOR ALL TO public USING (true) WITH CHECK (true);
