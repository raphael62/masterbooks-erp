-- Stock Transfer: move stock between locations
-- Timestamp: 20260309240000

-- stock_transfer_header
CREATE TABLE IF NOT EXISTS public.stock_transfer_header (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_no TEXT NOT NULL,
    transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
    from_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    to_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    from_location_name TEXT,
    to_location_name TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'posted')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stock_transfer_header_from ON public.stock_transfer_header(from_location_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfer_header_to ON public.stock_transfer_header(to_location_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfer_header_date ON public.stock_transfer_header(transfer_date);

-- stock_transfer_items
CREATE TABLE IF NOT EXISTS public.stock_transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    header_id UUID REFERENCES public.stock_transfer_header(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_code TEXT,
    product_name TEXT,
    qty NUMERIC(12, 2) NOT NULL DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_header ON public.stock_transfer_items(header_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfer_items_product ON public.stock_transfer_items(product_id);

-- RLS
ALTER TABLE public.stock_transfer_header ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfer_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stock_transfer_header_open" ON public.stock_transfer_header;
CREATE POLICY "stock_transfer_header_open" ON public.stock_transfer_header FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "stock_transfer_items_open" ON public.stock_transfer_items;
CREATE POLICY "stock_transfer_items_open" ON public.stock_transfer_items FOR ALL TO public USING (true) WITH CHECK (true);
