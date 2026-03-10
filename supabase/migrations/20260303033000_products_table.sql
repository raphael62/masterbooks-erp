-- Products Table Migration
-- Timestamp: 20260303033000

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code TEXT NOT NULL,
    product_name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    unit_of_measure TEXT DEFAULT 'Pieces',
    cost_price NUMERIC(12, 2) DEFAULT 0,
    selling_price NUMERIC(12, 2) DEFAULT 0,
    reorder_level NUMERIC(12, 2) DEFAULT 0,
    reorder_quantity NUMERIC(12, 2) DEFAULT 0,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    supplier_name TEXT,
    barcode TEXT,
    sku TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'active',
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_product_code ON public.products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON public.products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "authenticated_manage_products" ON public.products;
CREATE POLICY "authenticated_manage_products"
ON public.products
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Storage bucket for product images (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
DROP POLICY IF EXISTS "public_read_product_images" ON storage.objects;
CREATE POLICY "public_read_product_images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "authenticated_upload_product_images" ON storage.objects;
CREATE POLICY "authenticated_upload_product_images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "authenticated_update_product_images" ON storage.objects;
CREATE POLICY "authenticated_update_product_images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "authenticated_delete_product_images" ON storage.objects;
CREATE POLICY "authenticated_delete_product_images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND owner = auth.uid());

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_products_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_products_updated_at();
