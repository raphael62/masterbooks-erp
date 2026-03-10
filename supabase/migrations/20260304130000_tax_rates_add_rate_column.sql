-- Add 'rate' column to tax_rates table if it doesn't exist
ALTER TABLE public.tax_rates
ADD COLUMN IF NOT EXISTS rate NUMERIC(10, 4) DEFAULT 0;
