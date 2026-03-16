-- Ensure customers has balance_outstanding for Sales Invoice display
-- Run in Supabase SQL Editor if Balance Outsd. does not populate

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS balance_outstanding NUMERIC DEFAULT 0;
