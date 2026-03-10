-- Sales Invoices Module
-- Tables: sales_invoices, sales_invoice_items
-- Open RLS policies for all operations

CREATE TABLE IF NOT EXISTS public.sales_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_code TEXT,
  customer_name TEXT,
  sales_rep_id UUID REFERENCES public.business_executives(id) ON DELETE SET NULL,
  sales_rep_name TEXT,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  location_name TEXT,
  balance_outstanding NUMERIC DEFAULT 0,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_date DATE,
  vat_invoice_no TEXT,
  driver_name TEXT,
  payment_terms TEXT,
  trip_status TEXT DEFAULT 'Pending',
  vehicle_no TEXT,
  total_pre_tax NUMERIC DEFAULT 0,
  total_tax_amt NUMERIC DEFAULT 0,
  total_tax_inc_value NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.sales_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.sales_invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_code TEXT,
  product_name TEXT,
  price_type_id UUID REFERENCES public.price_types(id) ON DELETE SET NULL,
  price_type_name TEXT,
  pack_unit NUMERIC DEFAULT 0,
  btl_qty NUMERIC DEFAULT 0,
  ctn_qty NUMERIC DEFAULT 0,
  price_ex_tax NUMERIC DEFAULT 0,
  pre_tax NUMERIC DEFAULT 0,
  tax_rate NUMERIC DEFAULT 0,
  tax_amt NUMERIC DEFAULT 0,
  price_tax_inc NUMERIC DEFAULT 0,
  value_tax_inc NUMERIC DEFAULT 0,
  is_returnable BOOLEAN DEFAULT false,
  empties_value NUMERIC DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_invoices_customer_id ON public.sales_invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_invoice_date ON public.sales_invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_delivery_date ON public.sales_invoices(delivery_date);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_location_id ON public.sales_invoices(location_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_invoice_id ON public.sales_invoice_items(invoice_id);

ALTER TABLE public.sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sales_invoices_open_access" ON public.sales_invoices;
CREATE POLICY "sales_invoices_open_access" ON public.sales_invoices FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "sales_invoice_items_open_access" ON public.sales_invoice_items;
CREATE POLICY "sales_invoice_items_open_access" ON public.sales_invoice_items FOR ALL TO public USING (true) WITH CHECK (true);
