-- Supplier Ledger (Accounts Payable) Migration
-- Records AP entries created when purchase invoices are posted
-- Transaction date = Invoice Date

CREATE TABLE IF NOT EXISTS public.supplier_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  transaction_type TEXT NOT NULL DEFAULT 'purchase_invoice',
  reference_no TEXT,
  supplier_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  supplier_name TEXT,
  description TEXT,
  debit_amount NUMERIC(14,2) DEFAULT 0,
  credit_amount NUMERIC(14,2) DEFAULT 0,
  purchase_invoice_id UUID REFERENCES public.purchase_invoices(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_supplier_ledger_supplier_id ON public.supplier_ledger(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_ledger_transaction_date ON public.supplier_ledger(transaction_date);
CREATE INDEX IF NOT EXISTS idx_supplier_ledger_reference_no ON public.supplier_ledger(reference_no);
CREATE INDEX IF NOT EXISTS idx_supplier_ledger_invoice_id ON public.supplier_ledger(purchase_invoice_id);

-- Enable RLS
ALTER TABLE public.supplier_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "open_access_supplier_ledger" ON public.supplier_ledger;
CREATE POLICY "open_access_supplier_ledger" ON public.supplier_ledger FOR ALL TO public USING (true) WITH CHECK (true);

-- Also update purchase_invoices default status from 'draft' to 'posted'
ALTER TABLE public.purchase_invoices ALTER COLUMN status SET DEFAULT 'posted';

-- Update any existing draft/pending invoices to posted
UPDATE public.purchase_invoices
SET status = 'posted', posted_ap = true
WHERE status IN ('draft', 'pending');
