-- Add missing currency and notes columns to vendors table
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'GHS',
  ADD COLUMN IF NOT EXISTS notes TEXT;
