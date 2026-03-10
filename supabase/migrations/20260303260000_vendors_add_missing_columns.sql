-- Add missing columns to vendors table
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS bank_branch TEXT,
  ADD COLUMN IF NOT EXISTS mobile TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT;
