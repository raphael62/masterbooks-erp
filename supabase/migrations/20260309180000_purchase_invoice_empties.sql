-- Purchase Invoice Empties: returned to supplier per invoice
-- returned_qty = physically returned to supplier on this delivery

CREATE TABLE IF NOT EXISTS public.purchase_invoice_empties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.purchase_invoices(id) ON DELETE CASCADE,
  empties_type TEXT NOT NULL,
  returned_qty NUMERIC(14, 4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_purchase_invoice_empties_invoice_id ON public.purchase_invoice_empties(invoice_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_empties_empties_type ON public.purchase_invoice_empties(empties_type);

ALTER TABLE public.purchase_invoice_empties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "purchase_invoice_empties_open_access" ON public.purchase_invoice_empties;
CREATE POLICY "purchase_invoice_empties_open_access" ON public.purchase_invoice_empties FOR ALL TO public USING (true) WITH CHECK (true);
