-- Add pricing columns to price_list_items table
-- Timestamp: 20260304120000

ALTER TABLE public.price_list_items
ADD COLUMN IF NOT EXISTS pack_unit INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS price NUMERIC(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_rate_id UUID REFERENCES public.tax_rates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS vat_type TEXT DEFAULT 'exclusive' CHECK (vat_type IN ('inclusive', 'exclusive'));

CREATE INDEX IF NOT EXISTS idx_price_list_items_tax_rate_id ON public.price_list_items(tax_rate_id);
