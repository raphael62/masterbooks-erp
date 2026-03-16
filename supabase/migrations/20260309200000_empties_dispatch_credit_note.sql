-- Empties Dispatch: add Credit Note No. and Credit Note date
-- The credit note is the document the supplier issues when empties are returned

ALTER TABLE public.empties_dispatch_header
  ADD COLUMN IF NOT EXISTS credit_note_no TEXT,
  ADD COLUMN IF NOT EXISTS credit_note_date DATE;
