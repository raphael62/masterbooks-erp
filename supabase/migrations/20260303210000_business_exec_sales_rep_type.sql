-- Add sales_rep_type column to business_executives table
ALTER TABLE public.business_executives
ADD COLUMN IF NOT EXISTS sales_rep_type TEXT DEFAULT NULL;

-- Add a check constraint to ensure only valid values
ALTER TABLE public.business_executives
DROP CONSTRAINT IF EXISTS chk_sales_rep_type;

ALTER TABLE public.business_executives
ADD CONSTRAINT chk_sales_rep_type
CHECK (sales_rep_type IS NULL OR sales_rep_type IN ('VSR', 'SSR'));
