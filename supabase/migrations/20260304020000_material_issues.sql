-- Material Issues Migration
-- Creates material_issues and material_issue_items tables with RLS

-- Material Issues Header Table
CREATE TABLE IF NOT EXISTS public.material_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_no TEXT NOT NULL,
  production_order_id UUID REFERENCES public.production_orders(id) ON DELETE SET NULL,
  production_order_no TEXT,
  product_being_produced TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  from_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  from_location_name TEXT,
  issued_by TEXT,
  issued_by_id UUID REFERENCES public.business_executives(id) ON DELETE SET NULL,
  total_items_issued INTEGER DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status = ANY (ARRAY['Draft'::text, 'Confirmed'::text, 'Cancelled'::text])),
  notes TEXT,
  confirmed_at TIMESTAMPTZ,
  confirmed_by TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Material Issue Items Table
CREATE TABLE IF NOT EXISTS public.material_issue_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_issue_id UUID REFERENCES public.material_issues(id) ON DELETE CASCADE,
  line_no INTEGER NOT NULL DEFAULT 1,
  ingredient_code TEXT,
  ingredient_name TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  required_qty NUMERIC DEFAULT 0,
  available_stock NUMERIC DEFAULT 0,
  qty_to_issue NUMERIC DEFAULT 0,
  uom TEXT DEFAULT 'Units',
  unit_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  variance NUMERIC DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_material_issues_production_order_id ON public.material_issues(production_order_id);
CREATE INDEX IF NOT EXISTS idx_material_issues_status ON public.material_issues(status);
CREATE INDEX IF NOT EXISTS idx_material_issues_issue_date ON public.material_issues(issue_date);
CREATE INDEX IF NOT EXISTS idx_material_issues_from_location_id ON public.material_issues(from_location_id);
CREATE INDEX IF NOT EXISTS idx_material_issue_items_material_issue_id ON public.material_issue_items(material_issue_id);

-- Enable RLS
ALTER TABLE public.material_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_issue_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for material_issues
DROP POLICY IF EXISTS "material_issues_open_access" ON public.material_issues;
CREATE POLICY "material_issues_open_access" ON public.material_issues
  FOR ALL TO public USING (true) WITH CHECK (true);

-- RLS Policies for material_issue_items
DROP POLICY IF EXISTS "material_issue_items_open_access" ON public.material_issue_items;
CREATE POLICY "material_issue_items_open_access" ON public.material_issue_items
  FOR ALL TO public USING (true) WITH CHECK (true);
