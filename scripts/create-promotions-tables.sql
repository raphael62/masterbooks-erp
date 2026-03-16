-- Run this in Supabase Dashboard → SQL Editor if promotions table is missing
-- (Fixes: "Could not find the table 'public.promotions' in the schema cache")

-- promotions (header)
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_code TEXT NOT NULL,
  name TEXT NOT NULL,
  budget_cartons NUMERIC(14, 4),
  consumed_cartons NUMERIC(14, 4) DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  location_ids JSONB DEFAULT '[]',
  price_type_ids JSONB DEFAULT '[]',
  days_of_week JSONB DEFAULT '[]',
  happy_hour_start TIME,
  happy_hour_end TIME,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_promotions_code ON public.promotions(promotion_code);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON public.promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.promotions(active);

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "promotions_open_access" ON public.promotions;
CREATE POLICY "promotions_open_access" ON public.promotions FOR ALL TO public USING (true) WITH CHECK (true);

-- promotion_rules (Buy X Get Y)
CREATE TABLE IF NOT EXISTS public.promotion_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  buy_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  buy_product_code TEXT,
  buy_product_name TEXT,
  buy_qty NUMERIC(14, 4) NOT NULL DEFAULT 1,
  buy_unit TEXT DEFAULT 'Cartons',
  reward_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  reward_product_code TEXT,
  reward_product_name TEXT,
  reward_qty NUMERIC(14, 4) NOT NULL DEFAULT 1,
  reward_unit TEXT DEFAULT 'Cartons',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promotion_rules_promotion_id ON public.promotion_rules(promotion_id);

ALTER TABLE public.promotion_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "promotion_rules_open_access" ON public.promotion_rules;
CREATE POLICY "promotion_rules_open_access" ON public.promotion_rules FOR ALL TO public USING (true) WITH CHECK (true);
