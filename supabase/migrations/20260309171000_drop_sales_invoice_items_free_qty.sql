-- Revert: promotions are captured as separate line items with "FREE" in name, not free_qty column
ALTER TABLE public.sales_invoice_items
  DROP COLUMN IF EXISTS free_qty;
