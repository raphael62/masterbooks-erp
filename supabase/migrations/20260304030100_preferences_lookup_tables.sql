-- Product Categories, Units of Measure, and Empties Types tables
-- Migration: 20260304030100_preferences_lookup_tables.sql

-- ============================================================
-- 1. PRODUCT CATEGORIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_code TEXT NOT NULL,
  category_name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_categories_code ON public.product_categories (category_code);
CREATE INDEX IF NOT EXISTS idx_product_categories_status ON public.product_categories (status);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_product_categories" ON public.product_categories;
CREATE POLICY "allow_all_product_categories"
  ON public.product_categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 2. UNITS OF MEASURE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.units_of_measure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uom_code TEXT NOT NULL,
  uom_name TEXT NOT NULL,
  base_unit TEXT,
  conversion_factor NUMERIC(18, 6) DEFAULT 1,
  uom_type TEXT NOT NULL DEFAULT 'Count',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_units_of_measure_code ON public.units_of_measure (uom_code);
CREATE INDEX IF NOT EXISTS idx_units_of_measure_status ON public.units_of_measure (status);

ALTER TABLE public.units_of_measure ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_units_of_measure" ON public.units_of_measure;
CREATE POLICY "allow_all_units_of_measure"
  ON public.units_of_measure
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 3. EMPTIES TYPES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.empties_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empties_code TEXT NOT NULL,
  empties_name TEXT NOT NULL,
  description TEXT,
  unit_cost_ghs NUMERIC(18, 4) DEFAULT 0,
  deposit_amount_ghs NUMERIC(18, 4) DEFAULT 0,
  capacity NUMERIC(18, 4),
  uom TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_empties_types_code ON public.empties_types (empties_code);
CREATE INDEX IF NOT EXISTS idx_empties_types_status ON public.empties_types (status);

ALTER TABLE public.empties_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_empties_types" ON public.empties_types;
CREATE POLICY "allow_all_empties_types"
  ON public.empties_types
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 4. SEED DATA
-- ============================================================
DO $$
BEGIN
  -- Product Categories seed
  INSERT INTO public.product_categories (category_code, category_name, description, status) VALUES
    ('BEV', 'Beverages', 'All beverage products including soft drinks and water', 'active'),
    ('DAIRY', 'Dairy', 'Milk, cheese, yogurt and other dairy products', 'active'),
    ('SNACKS', 'Snacks', 'Chips, biscuits and snack foods', 'active'),
    ('GRAINS', 'Grains & Cereals', 'Rice, flour, oats and cereal products', 'active'),
    ('CANNED', 'Canned Goods', 'Canned vegetables, fruits and meats', 'active'),
    ('BAKERY', 'Bakery', 'Bread, cakes and baked goods', 'active'),
    ('CONDIMENTS', 'Condiments & Sauces', 'Ketchup, mustard, spices and sauces', 'active'),
    ('TOBACCO', 'Tobacco', 'Cigarettes and tobacco products', 'active'),
    ('CONFECT', 'Confectionery', 'Sweets, chocolates and candy', 'active'),
    ('RAWMAT', 'Raw Materials', 'Production raw materials and ingredients', 'active'),
    ('PKG', 'Packaging', 'Packaging materials and containers', 'active')
  ON CONFLICT (category_code) DO NOTHING;

  -- Units of Measure seed
  INSERT INTO public.units_of_measure (uom_code, uom_name, base_unit, conversion_factor, uom_type, status) VALUES
    ('PCS', 'Pieces', 'PCS', 1, 'Count', 'active'),
    ('CS', 'Cases', 'PCS', 24, 'Count', 'active'),
    ('BTL', 'Bottles', 'PCS', 1, 'Count', 'active'),
    ('CTN', 'Cartons', 'PCS', 12, 'Count', 'active'),
    ('BAG', 'Bags', 'PCS', 1, 'Count', 'active'),
    ('BOX', 'Boxes', 'PCS', 1, 'Count', 'active'),
    ('LTR', 'Litres', 'LTR', 1, 'Volume', 'active'),
    ('ML', 'Millilitres', 'LTR', 0.001, 'Volume', 'active'),
    ('KG', 'Kilograms', 'KG', 1, 'Weight', 'active'),
    ('G', 'Grams', 'KG', 0.001, 'Weight', 'active'),
    ('DZ', 'Dozens', 'PCS', 12, 'Count', 'active'),
    ('CRT', 'Crates', 'PCS', 24, 'Count', 'active'),
    ('PLT', 'Pallets', 'PCS', 1000, 'Count', 'active'),
    ('M', 'Metres', 'M', 1, 'Length', 'active'),
    ('CM', 'Centimetres', 'M', 0.01, 'Length', 'active')
  ON CONFLICT (uom_code) DO NOTHING;

  -- Empties Types seed
  INSERT INTO public.empties_types (empties_code, empties_name, description, unit_cost_ghs, deposit_amount_ghs, capacity, uom, status) VALUES
    ('PB-500', 'Plastic Bottle 500ml', 'Standard 500ml plastic returnable bottle', 2.50, 1.00, 500, 'ML', 'active'),
    ('GB-750', 'Glass Bottle 750ml', 'Standard 750ml glass returnable bottle', 5.00, 3.00, 750, 'ML', 'active'),
    ('PC-24', 'Plastic Crate 24', 'Plastic crate holding 24 bottles', 35.00, 20.00, 24, 'PCS', 'active'),
    ('KEG-50', 'Returnable Keg 50L', '50 litre returnable keg', 120.00, 80.00, 50, 'LTR', 'active')
  ON CONFLICT (empties_code) DO NOTHING;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Seed data insertion failed: %', SQLERRM;
END $$;
