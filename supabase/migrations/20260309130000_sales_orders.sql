-- Sales Orders Module
-- Tables: sales_orders (header), sales_order_items (line items)
-- Mirrors sales_invoices structure for order entry

CREATE TABLE IF NOT EXISTS public.sales_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no TEXT,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_code TEXT,
  customer_name TEXT,
  sales_rep_id UUID REFERENCES public.business_executives(id) ON DELETE SET NULL,
  sales_rep_name TEXT,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  location_name TEXT,
  balance_outstanding NUMERIC DEFAULT 0,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_date DATE,
  due_date DATE,
  amount NUMERIC DEFAULT 0,
  vat NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.sales_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.sales_orders(id) ON DELETE CASCADE,
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
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_orders_customer_id ON public.sales_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_order_date ON public.sales_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON public.sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_order_items_order_id ON public.sales_order_items(order_id);

ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sales_orders_open_access" ON public.sales_orders;
CREATE POLICY "sales_orders_open_access" ON public.sales_orders FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "sales_order_items_open_access" ON public.sales_order_items;
CREATE POLICY "sales_order_items_open_access" ON public.sales_order_items FOR ALL TO public USING (true) WITH CHECK (true);
