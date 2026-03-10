-- Fix RLS policies on tax_rates table
-- Drop all existing policies and replace with permissive public access

ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on tax_rates
DROP POLICY IF EXISTS "tax_rates_select" ON public.tax_rates;
DROP POLICY IF EXISTS "tax_rates_insert" ON public.tax_rates;
DROP POLICY IF EXISTS "tax_rates_update" ON public.tax_rates;
DROP POLICY IF EXISTS "tax_rates_delete" ON public.tax_rates;
DROP POLICY IF EXISTS "tax_rates_all" ON public.tax_rates;
DROP POLICY IF EXISTS "Allow public read access" ON public.tax_rates;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.tax_rates;
DROP POLICY IF EXISTS "Allow authenticated update" ON public.tax_rates;
DROP POLICY IF EXISTS "Allow authenticated delete" ON public.tax_rates;
DROP POLICY IF EXISTS "anon_read_tax_rates" ON public.tax_rates;
DROP POLICY IF EXISTS "authenticated_all_tax_rates" ON public.tax_rates;
DROP POLICY IF EXISTS "public_read_tax_rates" ON public.tax_rates;
DROP POLICY IF EXISTS "users_manage_tax_rates" ON public.tax_rates;
DROP POLICY IF EXISTS "enable_all_for_authenticated" ON public.tax_rates;
DROP POLICY IF EXISTS "enable_read_for_all" ON public.tax_rates;
DROP POLICY IF EXISTS "tax_rates_open_access" ON public.tax_rates;

-- Create a single permissive policy allowing all operations for both anon and authenticated roles
CREATE POLICY "tax_rates_public_all"
ON public.tax_rates
FOR ALL
TO public
USING (true)
WITH CHECK (true);
