-- VSR Monthly Targets and SSR Monthly Targets tables

-- VSR Monthly Targets table
CREATE TABLE IF NOT EXISTS public.vsr_monthly_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  executive_code TEXT NOT NULL,
  executive_name TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  target_qty_cases NUMERIC DEFAULT 0,
  target_qty_bottles NUMERIC DEFAULT 0,
  target_value NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vsr_monthly_targets_exec_code ON public.vsr_monthly_targets(executive_code);
CREATE INDEX IF NOT EXISTS idx_vsr_monthly_targets_year_month ON public.vsr_monthly_targets(year, month);
CREATE INDEX IF NOT EXISTS idx_vsr_monthly_targets_product_code ON public.vsr_monthly_targets(product_code);

ALTER TABLE public.vsr_monthly_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_vsr_monthly_targets" ON public.vsr_monthly_targets;
CREATE POLICY "allow_all_vsr_monthly_targets"
  ON public.vsr_monthly_targets
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- SSR Monthly Targets table
CREATE TABLE IF NOT EXISTS public.ssr_monthly_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  executive_code TEXT NOT NULL,
  executive_name TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  target_value NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ssr_monthly_targets_exec_code ON public.ssr_monthly_targets(executive_code);
CREATE INDEX IF NOT EXISTS idx_ssr_monthly_targets_year_month ON public.ssr_monthly_targets(year, month);

ALTER TABLE public.ssr_monthly_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_ssr_monthly_targets" ON public.ssr_monthly_targets;
CREATE POLICY "allow_all_ssr_monthly_targets"
  ON public.ssr_monthly_targets
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);
