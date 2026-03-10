-- Products Table: Add Empties Type, Taxable, Returnable columns
-- Timestamp: 20260303060000

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS empties_type TEXT DEFAULT 'None',
  ADD COLUMN IF NOT EXISTS is_taxable BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_returnable BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS plastic_cost NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bottle_cost NUMERIC(12, 2) DEFAULT 0;

-- Index for empties_type filtering
CREATE INDEX IF NOT EXISTS idx_products_empties_type ON public.products(empties_type);
CREATE INDEX IF NOT EXISTS idx_products_is_returnable ON public.products(is_returnable);
CREATE INDEX IF NOT EXISTS idx_products_is_taxable ON public.products(is_taxable);
