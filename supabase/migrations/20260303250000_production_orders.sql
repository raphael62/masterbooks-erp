-- Production Orders Module Migration
-- Creates production_orders and production_order_items (Bill of Materials) tables

-- 1. Create production_orders table
CREATE TABLE IF NOT EXISTS public.production_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no TEXT NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_code TEXT,
    planned_qty NUMERIC NOT NULL DEFAULT 0,
    actual_qty NUMERIC DEFAULT 0,
    uom TEXT DEFAULT 'Units',
    pack_unit INTEGER DEFAULT 1,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'Planned' CHECK (status IN ('Planned', 'In Progress', 'Completed', 'On Hold')),
    location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    location_name TEXT,
    assigned_to TEXT,
    notes TEXT,
    total_material_cost NUMERIC DEFAULT 0,
    labor_cost NUMERIC DEFAULT 0,
    overhead_cost NUMERIC DEFAULT 0,
    packaging_cost NUMERIC DEFAULT 0,
    total_cost NUMERIC DEFAULT 0,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create production_order_items (Bill of Materials) table
CREATE TABLE IF NOT EXISTS public.production_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_order_id UUID REFERENCES public.production_orders(id) ON DELETE CASCADE,
    material_code TEXT,
    material_name TEXT NOT NULL,
    required_qty NUMERIC NOT NULL DEFAULT 0,
    uom TEXT DEFAULT 'Units',
    unit_cost NUMERIC DEFAULT 0,
    total_cost NUMERIC DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_production_orders_company_id ON public.production_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_status ON public.production_orders(status);
CREATE INDEX IF NOT EXISTS idx_production_orders_start_date ON public.production_orders(start_date);
CREATE INDEX IF NOT EXISTS idx_production_orders_location_id ON public.production_orders(location_id);
CREATE INDEX IF NOT EXISTS idx_production_order_items_order_id ON public.production_order_items(production_order_id);

-- 4. Enable RLS
ALTER TABLE public.production_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_order_items ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for production_orders
DROP POLICY IF EXISTS "authenticated_all_production_orders" ON public.production_orders;
CREATE POLICY "authenticated_all_production_orders"
ON public.production_orders
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 6. RLS Policies for production_order_items
DROP POLICY IF EXISTS "authenticated_all_production_order_items" ON public.production_order_items;
CREATE POLICY "authenticated_all_production_order_items"
ON public.production_order_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 7. Updated_at trigger function (reuse or create)
CREATE OR REPLACE FUNCTION public.update_production_orders_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_production_orders_updated_at ON public.production_orders;
CREATE TRIGGER set_production_orders_updated_at
    BEFORE UPDATE ON public.production_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_production_orders_updated_at();
