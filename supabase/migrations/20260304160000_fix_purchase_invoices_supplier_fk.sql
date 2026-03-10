-- Fix purchase_invoices supplier_id foreign key
-- Drop old FK referencing suppliers(id) and recreate referencing vendors(id)

DO $$
BEGIN
  -- Drop the old foreign key constraint if it exists
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'purchase_invoices_supplier_id_fkey'
      AND table_name = 'purchase_invoices'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.purchase_invoices
      DROP CONSTRAINT purchase_invoices_supplier_id_fkey;
  END IF;
END;
$$;

-- Recreate the foreign key referencing vendors(id) instead of suppliers(id)
ALTER TABLE public.purchase_invoices
  ADD CONSTRAINT purchase_invoices_supplier_id_fkey
  FOREIGN KEY (supplier_id)
  REFERENCES public.vendors(id)
  ON DELETE SET NULL;
