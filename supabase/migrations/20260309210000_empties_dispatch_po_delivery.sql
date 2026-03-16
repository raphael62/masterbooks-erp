-- Empties Dispatch: add PO Number and Delivery Note

ALTER TABLE public.empties_dispatch_header
  ADD COLUMN IF NOT EXISTS po_number TEXT,
  ADD COLUMN IF NOT EXISTS delivery_note TEXT;
