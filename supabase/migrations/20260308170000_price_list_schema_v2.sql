-- Price List Schema V2: Add spec-required columns
-- Timestamp: 20260308170000

-- Add new columns to price_list_headers
ALTER TABLE public.price_list_headers
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS effective_date DATE,
  ADD COLUMN IF NOT EXISTS expiry_date DATE,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add new columns to price_list_items
ALTER TABLE public.price_list_items
  ADD COLUMN IF NOT EXISTS header_id UUID REFERENCES public.price_list_headers(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS uom TEXT,
  ADD COLUMN IF NOT EXISTS price_tax_inc NUMERIC(12,4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pre_tax_price NUMERIC(12,4) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_price_list_items_header_id_v2 ON public.price_list_items(header_id);
CREATE INDEX IF NOT EXISTS idx_price_list_items_product_id ON public.price_list_items(product_id);
