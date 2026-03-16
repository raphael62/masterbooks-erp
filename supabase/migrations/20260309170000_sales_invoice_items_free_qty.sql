-- Add free_qty to sales_invoice_items for promotional quantities (empties of promotions)
ALTER TABLE public.sales_invoice_items
  ADD COLUMN IF NOT EXISTS free_qty NUMERIC(14, 4) DEFAULT 0;
