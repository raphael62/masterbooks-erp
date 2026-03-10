-- Bill of Materials (BOM) Tables Migration
-- Creates bom_headers and bom_items tables with full RLS

-- BOM Headers Table
CREATE TABLE IF NOT EXISTS public.bom_headers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_code TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_code TEXT,
  version TEXT NOT NULL DEFAULT '1.0',
  effective_date DATE,
  expiry_date DATE,
  total_material_cost NUMERIC DEFAULT 0,
  labor_cost NUMERIC DEFAULT 0,
  overhead_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status = ANY (ARRAY['Draft'::text, 'Active'::text, 'Archived'::text])),
  notes TEXT,
  created_by TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- BOM Items Table
CREATE TABLE IF NOT EXISTS public.bom_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_header_id UUID REFERENCES public.bom_headers(id) ON DELETE CASCADE,
  line_no INTEGER NOT NULL DEFAULT 1,
  material_code TEXT,
  material_name TEXT NOT NULL,
  uom TEXT DEFAULT 'Units',
  quantity_required NUMERIC DEFAULT 0,
  waste_factor NUMERIC DEFAULT 0,
  adjusted_qty NUMERIC DEFAULT 0,
  unit_cost NUMERIC DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bom_headers_product_id ON public.bom_headers(product_id);
CREATE INDEX IF NOT EXISTS idx_bom_headers_status ON public.bom_headers(status);
CREATE INDEX IF NOT EXISTS idx_bom_headers_bom_code ON public.bom_headers(bom_code);
CREATE INDEX IF NOT EXISTS idx_bom_items_bom_header_id ON public.bom_items(bom_header_id);

-- Enable RLS
ALTER TABLE public.bom_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bom_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bom_headers
DROP POLICY IF EXISTS "bom_headers_open_access" ON public.bom_headers;
CREATE POLICY "bom_headers_open_access" ON public.bom_headers
  FOR ALL TO public USING (true) WITH CHECK (true);

-- RLS Policies for bom_items
DROP POLICY IF EXISTS "bom_items_open_access" ON public.bom_items;
CREATE POLICY "bom_items_open_access" ON public.bom_items
  FOR ALL TO public USING (true) WITH CHECK (true);
