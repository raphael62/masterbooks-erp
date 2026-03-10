-- Supplier Payments Migration
-- Records payments made to suppliers with invoice allocation tracking

CREATE TABLE IF NOT EXISTS public.supplier_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_no TEXT NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  supplier_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  supplier_name TEXT,
  payment_account TEXT,
  cheque_ref_no TEXT,
  total_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  allocated_amount NUMERIC(14,2) DEFAULT 0,
  notes TEXT,
  status TEXT DEFAULT 'unallocated',
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.supplier_payment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_payment_id UUID REFERENCES public.supplier_payments(id) ON DELETE CASCADE,
  purchase_invoice_id UUID REFERENCES public.purchase_invoices(id) ON DELETE SET NULL,
  allocated_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_supplier_payments_supplier_id ON public.supplier_payments(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_payment_date ON public.supplier_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_supplier_payments_payment_no ON public.supplier_payments(payment_no);
CREATE INDEX IF NOT EXISTS idx_supplier_payment_allocs_payment_id ON public.supplier_payment_allocations(supplier_payment_id);
CREATE INDEX IF NOT EXISTS idx_supplier_payment_allocs_invoice_id ON public.supplier_payment_allocations(purchase_invoice_id);

-- Enable RLS
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_payment_allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "open_access_supplier_payments" ON public.supplier_payments;
CREATE POLICY "open_access_supplier_payments" ON public.supplier_payments FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "open_access_supplier_payment_allocations" ON public.supplier_payment_allocations;
CREATE POLICY "open_access_supplier_payment_allocations" ON public.supplier_payment_allocations FOR ALL TO public USING (true) WITH CHECK (true);
