-- Supplier Ledger: add empties_dispatch_header FK for empties dispatch transactions

ALTER TABLE public.supplier_ledger
  ADD COLUMN IF NOT EXISTS empties_dispatch_header_id UUID REFERENCES public.empties_dispatch_header(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_supplier_ledger_empties_dispatch ON public.supplier_ledger(empties_dispatch_header_id);
