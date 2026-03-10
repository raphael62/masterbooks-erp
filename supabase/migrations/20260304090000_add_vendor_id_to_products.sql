-- Add vendor_id column to products table
-- Fixes: Could not find the 'vendor_id' column of 'products' in the schema cache

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_vendor_id ON public.products(vendor_id);
