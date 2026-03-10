-- Fix RLS: Grant full access to anon role for lookup tables
-- These are internal reference tables (product_categories, units_of_measure, empties_types)
-- that need to be writable regardless of auth session state

-- ============================================================
-- product_categories: add anon full access
-- ============================================================
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_categories_all_authenticated" ON public.product_categories;
DROP POLICY IF EXISTS "product_categories_select_anon" ON public.product_categories;
DROP POLICY IF EXISTS "product_categories_all_anon" ON public.product_categories;
DROP POLICY IF EXISTS "allow_all_product_categories" ON public.product_categories;

CREATE POLICY "product_categories_all_access"
  ON public.product_categories
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- units_of_measure: add anon full access
-- ============================================================
ALTER TABLE public.units_of_measure ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "units_of_measure_all_authenticated" ON public.units_of_measure;
DROP POLICY IF EXISTS "units_of_measure_select_anon" ON public.units_of_measure;
DROP POLICY IF EXISTS "units_of_measure_all_anon" ON public.units_of_measure;
DROP POLICY IF EXISTS "allow_all_units_of_measure" ON public.units_of_measure;

CREATE POLICY "units_of_measure_all_access"
  ON public.units_of_measure
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- empties_types: add anon full access
-- ============================================================
ALTER TABLE public.empties_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "empties_types_all_authenticated" ON public.empties_types;
DROP POLICY IF EXISTS "empties_types_select_anon" ON public.empties_types;
DROP POLICY IF EXISTS "empties_types_all_anon" ON public.empties_types;
DROP POLICY IF EXISTS "allow_all_empties_types" ON public.empties_types;

CREATE POLICY "empties_types_all_access"
  ON public.empties_types
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
