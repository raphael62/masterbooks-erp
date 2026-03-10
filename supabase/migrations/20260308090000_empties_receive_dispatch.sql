-- Empties Receive & Dispatch Tables
-- Timestamp: 20260308090000

-- empties_receive_header
CREATE TABLE IF NOT EXISTS public.empties_receive_header (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receive_no TEXT NOT NULL,
    receive_date DATE NOT NULL DEFAULT CURRENT_DATE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT,
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    location_name TEXT,
    notes TEXT,
    total_value NUMERIC(14, 2) DEFAULT 0,
    status TEXT DEFAULT 'posted',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_erh_customer_id ON public.empties_receive_header(customer_id);
CREATE INDEX IF NOT EXISTS idx_erh_location_id ON public.empties_receive_header(location_id);
CREATE INDEX IF NOT EXISTS idx_erh_receive_date ON public.empties_receive_header(receive_date);

-- empties_receive_items
CREATE TABLE IF NOT EXISTS public.empties_receive_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    header_id UUID REFERENCES public.empties_receive_header(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_code TEXT,
    product_name TEXT,
    empties_type TEXT,
    qty NUMERIC(12, 2) DEFAULT 0,
    unit_price NUMERIC(14, 4) DEFAULT 0,
    total_value NUMERIC(14, 2) DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_eri_header_id ON public.empties_receive_items(header_id);
CREATE INDEX IF NOT EXISTS idx_eri_product_id ON public.empties_receive_items(product_id);

-- empties_dispatch_header
CREATE TABLE IF NOT EXISTS public.empties_dispatch_header (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispatch_no TEXT NOT NULL,
    dispatch_date DATE NOT NULL DEFAULT CURRENT_DATE,
    supplier_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
    supplier_name TEXT,
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    location_name TEXT,
    notes TEXT,
    total_value NUMERIC(14, 2) DEFAULT 0,
    status TEXT DEFAULT 'posted',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_edh_supplier_id ON public.empties_dispatch_header(supplier_id);
CREATE INDEX IF NOT EXISTS idx_edh_location_id ON public.empties_dispatch_header(location_id);
CREATE INDEX IF NOT EXISTS idx_edh_dispatch_date ON public.empties_dispatch_header(dispatch_date);

-- empties_dispatch_items
CREATE TABLE IF NOT EXISTS public.empties_dispatch_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    header_id UUID REFERENCES public.empties_dispatch_header(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_code TEXT,
    product_name TEXT,
    empties_type TEXT,
    qty NUMERIC(12, 2) DEFAULT 0,
    unit_price NUMERIC(14, 4) DEFAULT 0,
    total_value NUMERIC(14, 2) DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_edi_header_id ON public.empties_dispatch_items(header_id);
CREATE INDEX IF NOT EXISTS idx_edi_product_id ON public.empties_dispatch_items(product_id);

-- Enable RLS
ALTER TABLE public.empties_receive_header ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empties_receive_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empties_dispatch_header ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empties_dispatch_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies - open access
DROP POLICY IF EXISTS "open_access_empties_receive_header" ON public.empties_receive_header;
CREATE POLICY "open_access_empties_receive_header"
ON public.empties_receive_header FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "open_access_empties_receive_items" ON public.empties_receive_items;
CREATE POLICY "open_access_empties_receive_items"
ON public.empties_receive_items FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "open_access_empties_dispatch_header" ON public.empties_dispatch_header;
CREATE POLICY "open_access_empties_dispatch_header"
ON public.empties_dispatch_header FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "open_access_empties_dispatch_items" ON public.empties_dispatch_items;
CREATE POLICY "open_access_empties_dispatch_items"
ON public.empties_dispatch_items FOR ALL TO public USING (true) WITH CHECK (true);
