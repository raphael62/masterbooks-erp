-- Fix RLS policies for product_categories, units_of_measure, and empties_types
-- Drop all existing policies and recreate with permissive access for authenticated users

-- ============================================================
-- FIX: product_categories RLS
-- ============================================================
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_product_categories" ON public.product_categories;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.product_categories;
DROP POLICY IF EXISTS "Allow read for anon" ON public.product_categories;
DROP POLICY IF EXISTS "product_categories_select" ON public.product_categories;
DROP POLICY IF EXISTS "product_categories_insert" ON public.product_categories;
DROP POLICY IF EXISTS "product_categories_update" ON public.product_categories;
DROP POLICY IF EXISTS "product_categories_delete" ON public.product_categories;

CREATE POLICY "product_categories_all_authenticated"
  ON public.product_categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "product_categories_select_anon"
  ON public.product_categories
  FOR SELECT
  TO anon
  USING (true);

-- ============================================================
-- FIX: units_of_measure RLS
-- ============================================================
ALTER TABLE public.units_of_measure ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_units_of_measure" ON public.units_of_measure;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.units_of_measure;
DROP POLICY IF EXISTS "Allow read for anon" ON public.units_of_measure;
DROP POLICY IF EXISTS "units_of_measure_select" ON public.units_of_measure;
DROP POLICY IF EXISTS "units_of_measure_insert" ON public.units_of_measure;
DROP POLICY IF EXISTS "units_of_measure_update" ON public.units_of_measure;
DROP POLICY IF EXISTS "units_of_measure_delete" ON public.units_of_measure;

CREATE POLICY "units_of_measure_all_authenticated"
  ON public.units_of_measure
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "units_of_measure_select_anon"
  ON public.units_of_measure
  FOR SELECT
  TO anon
  USING (true);

-- ============================================================
-- FIX: empties_types RLS
-- ============================================================
ALTER TABLE public.empties_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_empties_types" ON public.empties_types;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.empties_types;
DROP POLICY IF EXISTS "Allow read for anon" ON public.empties_types;
DROP POLICY IF EXISTS "empties_types_select" ON public.empties_types;
DROP POLICY IF EXISTS "empties_types_insert" ON public.empties_types;
DROP POLICY IF EXISTS "empties_types_update" ON public.empties_types;
DROP POLICY IF EXISTS "empties_types_delete" ON public.empties_types;

CREATE POLICY "empties_types_all_authenticated"
  ON public.empties_types
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "empties_types_select_anon"
  ON public.empties_types
  FOR SELECT
  TO anon
  USING (true);
