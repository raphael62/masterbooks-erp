-- Sales Invoice Empties: received and sold per invoice (affects customer empties position)
-- received_qty = physically returned on this delivery
-- sold_qty = customer paid for empties kept (reduces owed)

CREATE TABLE IF NOT EXISTS public.sales_invoice_empties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.sales_invoices(id) ON DELETE CASCADE,
  empties_type TEXT NOT NULL,
  received_qty NUMERIC(14, 4) DEFAULT 0,
  sold_qty NUMERIC(14, 4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_invoice_empties_invoice_id ON public.sales_invoice_empties(invoice_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoice_empties_empties_type ON public.sales_invoice_empties(empties_type);

ALTER TABLE public.sales_invoice_empties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sales_invoice_empties_open_access" ON public.sales_invoice_empties;
CREATE POLICY "sales_invoice_empties_open_access" ON public.sales_invoice_empties FOR ALL TO public USING (true) WITH CHECK (true);
