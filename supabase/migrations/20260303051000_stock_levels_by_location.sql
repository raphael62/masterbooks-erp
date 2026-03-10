-- Stock Levels by Location Migration
-- Timestamp: 20260303051000

-- Add pack_unit column to products table if not exists
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS pack_unit INTEGER DEFAULT 1;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_returnable BOOLEAN DEFAULT false;

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS conversion_factor NUMERIC(10, 4) DEFAULT 1;

-- Create locations table if not exists (for multi-location support)
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_code TEXT NOT NULL,
    location_name TEXT NOT NULL,
    location_type TEXT DEFAULT 'warehouse',
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_locations_company_id ON public.locations(company_id);
CREATE INDEX IF NOT EXISTS idx_locations_is_active ON public.locations(is_active);

-- Create stock_levels_by_location table
CREATE TABLE IF NOT EXISTS public.stock_levels_by_location (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
    stock_on_hand NUMERIC(12, 2) DEFAULT 0,
    reorder_level NUMERIC(12, 2) DEFAULT 0,
    max_stock_level NUMERIC(12, 2) DEFAULT 0,
    last_movement_date TIMESTAMPTZ,
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stock_levels_product_id ON public.stock_levels_by_location(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_location_id ON public.stock_levels_by_location(location_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_company_id ON public.stock_levels_by_location(company_id);

-- Enable RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_levels_by_location ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "authenticated_manage_locations" ON public.locations;
CREATE POLICY "authenticated_manage_locations"
ON public.locations
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_manage_stock_levels" ON public.stock_levels_by_location;
CREATE POLICY "authenticated_manage_stock_levels"
ON public.stock_levels_by_location
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Updated_at trigger for locations
CREATE OR REPLACE FUNCTION public.update_locations_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS locations_updated_at ON public.locations;
CREATE TRIGGER locations_updated_at
    BEFORE UPDATE ON public.locations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_locations_updated_at();

-- Updated_at trigger for stock_levels_by_location
CREATE OR REPLACE FUNCTION public.update_stock_levels_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stock_levels_updated_at ON public.stock_levels_by_location;
CREATE TRIGGER stock_levels_updated_at
    BEFORE UPDATE ON public.stock_levels_by_location
    FOR EACH ROW
    EXECUTE FUNCTION public.update_stock_levels_updated_at();

-- Seed default locations
DO $$
BEGIN
    INSERT INTO public.locations (id, location_code, location_name, location_type, is_active)
    VALUES
        (gen_random_uuid(), 'WH-MAIN', 'Main Warehouse', 'warehouse', true),
        (gen_random_uuid(), 'BR-ACCRA', 'Accra Branch', 'branch', true),
        (gen_random_uuid(), 'BR-KUMASI', 'Kumasi Branch', 'branch', true),
        (gen_random_uuid(), 'WH-TEMA', 'Tema Warehouse', 'warehouse', true)
    ON CONFLICT DO NOTHING;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Location seed failed: %', SQLERRM;
END $$;
