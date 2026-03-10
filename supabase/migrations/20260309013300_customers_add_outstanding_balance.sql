-- Add outstanding_balance column to customers table
-- This column is queried in SalesInvoiceForm but was missing from the original schema

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS outstanding_balance NUMERIC DEFAULT 0;
