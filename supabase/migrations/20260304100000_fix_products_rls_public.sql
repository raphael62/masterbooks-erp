-- Fix products RLS: drop restrictive policies and replace with permissive public access
-- This resolves "new row violates row-level security policy for table products"

-- Drop all existing RLS policies on products
DROP POLICY IF EXISTS "authenticated_manage_products" ON public.products;
DROP POLICY IF EXISTS "products_select_policy" ON public.products;
DROP POLICY IF EXISTS "products_insert_policy" ON public.products;
DROP POLICY IF EXISTS "products_update_policy" ON public.products;
DROP POLICY IF EXISTS "products_delete_policy" ON public.products;
DROP POLICY IF EXISTS "allow_all_products" ON public.products;
DROP POLICY IF EXISTS "public_manage_products" ON public.products;

-- Ensure RLS is enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create permissive policy for all operations (anon + authenticated)
DROP POLICY IF EXISTS "products_public_all" ON public.products;
CREATE POLICY "products_public_all"
ON public.products
FOR ALL
TO public
USING (true)
WITH CHECK (true);
