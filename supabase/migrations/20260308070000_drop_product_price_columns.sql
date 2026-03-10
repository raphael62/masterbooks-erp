-- Drop cost_price and selling_price columns from products table
-- Prices are managed exclusively through the price list module

ALTER TABLE public.products
  DROP COLUMN IF EXISTS cost_price,
  DROP COLUMN IF EXISTS selling_price;
