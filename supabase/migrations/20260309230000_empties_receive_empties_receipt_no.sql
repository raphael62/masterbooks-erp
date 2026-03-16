-- Add manual Empties Receipt No. to empties_receive_header (receive_no remains auto-generated)
ALTER TABLE public.empties_receive_header
  ADD COLUMN IF NOT EXISTS empties_receipt_no TEXT;
