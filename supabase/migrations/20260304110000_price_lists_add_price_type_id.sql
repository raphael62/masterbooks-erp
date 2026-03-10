-- Migration: Replace customer_type with price_type_id in price_lists and price_list_headers
-- Timestamp: 20260304110000

-- Update price_list_headers table
ALTER TABLE public.price_list_headers
  ADD COLUMN IF NOT EXISTS price_type_id UUID REFERENCES public.price_types(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_price_list_headers_price_type_id ON public.price_list_headers(price_type_id);

-- Update price_lists table
ALTER TABLE public.price_lists
  ADD COLUMN IF NOT EXISTS price_type_id UUID REFERENCES public.price_types(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_price_lists_price_type_id ON public.price_lists(price_type_id);
