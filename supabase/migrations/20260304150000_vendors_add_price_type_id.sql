-- Add price_type_id column to vendors table
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS price_type_id UUID REFERENCES public.price_types(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_vendors_price_type_id ON public.vendors(price_type_id);
