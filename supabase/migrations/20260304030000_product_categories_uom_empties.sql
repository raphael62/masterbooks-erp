-- ============================================================
-- Product Categories Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_code TEXT NOT NULL,
  category_name TEXT NOT NULL,
  description TEXT,
  product_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT product_categories_code_unique UNIQUE (category_code)
);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'product_categories' AND policyname = 'Allow all for authenticated'
  ) THEN
    CREATE POLICY "Allow all for authenticated" ON public.product_categories
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'product_categories' AND policyname = 'Allow read for anon'
  ) THEN
    CREATE POLICY "Allow read for anon" ON public.product_categories
      FOR SELECT TO anon USING (true);
  END IF;
END $$;

-- ============================================================
-- Units of Measure Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.units_of_measure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uom_code TEXT NOT NULL,
  uom_name TEXT NOT NULL,
  base_unit TEXT,
  conversion_factor NUMERIC(18,6) DEFAULT 1,
  uom_type TEXT NOT NULL DEFAULT 'Count',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT units_of_measure_code_unique UNIQUE (uom_code)
);

ALTER TABLE public.units_of_measure ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'units_of_measure' AND policyname = 'Allow all for authenticated'
  ) THEN
    CREATE POLICY "Allow all for authenticated" ON public.units_of_measure
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'units_of_measure' AND policyname = 'Allow read for anon'
  ) THEN
    CREATE POLICY "Allow read for anon" ON public.units_of_measure
      FOR SELECT TO anon USING (true);
  END IF;
END $$;

-- ============================================================
-- Empties Types Table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.empties_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empties_code TEXT NOT NULL,
  empties_name TEXT NOT NULL,
  description TEXT,
  unit_cost NUMERIC(18,2) DEFAULT 0,
  deposit_amount NUMERIC(18,2) DEFAULT 0,
  capacity NUMERIC(18,3),
  uom TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT empties_types_code_unique UNIQUE (empties_code)
);

ALTER TABLE public.empties_types ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'empties_types' AND policyname = 'Allow all for authenticated'
  ) THEN
    CREATE POLICY "Allow all for authenticated" ON public.empties_types
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'empties_types' AND policyname = 'Allow read for anon'
  ) THEN
    CREATE POLICY "Allow read for anon" ON public.empties_types
      FOR SELECT TO anon USING (true);
  END IF;
END $$;
