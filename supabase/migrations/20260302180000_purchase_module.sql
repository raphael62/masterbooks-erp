-- Purchase Module Migration
-- Tables: purchase_orders, purchase_order_items, goods_receipts, goods_receipt_items

-- Purchase Orders table
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT,
  status TEXT DEFAULT 'draft',
  order_date DATE DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  delivery_address TEXT,
  subtotal NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  notes TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Order Items table
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_code TEXT,
  description TEXT,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  tax_rate NUMERIC DEFAULT 0,
  discount_percent NUMERIC DEFAULT 0,
  line_total NUMERIC DEFAULT 0,
  received_quantity NUMERIC DEFAULT 0,
  delivery_date DATE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Goods Receipts table
CREATE TABLE IF NOT EXISTS public.goods_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gr_number TEXT NOT NULL,
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  po_number TEXT,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT,
  receipt_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  received_by TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Goods Receipt Items table
CREATE TABLE IF NOT EXISTS public.goods_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goods_receipt_id UUID REFERENCES public.goods_receipts(id) ON DELETE CASCADE,
  purchase_order_item_id UUID REFERENCES public.purchase_order_items(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_code TEXT,
  ordered_quantity NUMERIC DEFAULT 0,
  received_quantity NUMERIC NOT NULL DEFAULT 0,
  unit_cost NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_company_id ON public.purchase_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po_id ON public.purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_goods_receipts_po_id ON public.goods_receipts(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_goods_receipt_items_gr_id ON public.goods_receipt_items(goods_receipt_id);

-- Enable RLS
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_receipt_items ENABLE ROW LEVEL SECURITY;

-- Open access RLS policies (matching existing pattern in this project)
DROP POLICY IF EXISTS "open_access_purchase_orders" ON public.purchase_orders;
CREATE POLICY "open_access_purchase_orders" ON public.purchase_orders FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "open_access_purchase_order_items" ON public.purchase_order_items;
CREATE POLICY "open_access_purchase_order_items" ON public.purchase_order_items FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "open_access_goods_receipts" ON public.goods_receipts;
CREATE POLICY "open_access_goods_receipts" ON public.goods_receipts FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "open_access_goods_receipt_items" ON public.goods_receipt_items;
CREATE POLICY "open_access_goods_receipt_items" ON public.goods_receipt_items FOR ALL TO public USING (true) WITH CHECK (true);
