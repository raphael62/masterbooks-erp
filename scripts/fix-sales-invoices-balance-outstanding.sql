-- Fix sales_invoices.balance_outstanding: set to invoice total (was wrongly storing customer's previous balance)
-- Run once to correct existing data
UPDATE public.sales_invoices
SET balance_outstanding = total_tax_inc_value
WHERE (balance_outstanding IS NULL OR balance_outstanding != total_tax_inc_value)
  AND total_tax_inc_value IS NOT NULL
  AND total_tax_inc_value > 0;
