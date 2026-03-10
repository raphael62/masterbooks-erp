-- ============================================================
-- CLEAR ALL DATA - Reset all tables to empty state
-- Keeps table structures and schemas intact
-- Deletes in reverse dependency order (children before parents)
-- ============================================================

DO $$
BEGIN

  -- ============================================================
  -- STEP 1: Clear transaction/movement tables first (deepest children)
  -- ============================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'returnable_transactions') THEN
    DELETE FROM public.returnable_transactions;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_movements') THEN
    DELETE FROM public.stock_movements;
  END IF;

  -- ============================================================
  -- STEP 2: Clear invoice line items
  -- ============================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_invoice_items') THEN
    DELETE FROM public.purchase_invoice_items;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'goods_receipt_items') THEN
    DELETE FROM public.goods_receipt_items;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_order_items') THEN
    DELETE FROM public.purchase_order_items;
  END IF;

  -- ============================================================
  -- STEP 3: Clear invoices and orders
  -- ============================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales_invoices') THEN
    DELETE FROM public.sales_invoices;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales_orders') THEN
    DELETE FROM public.sales_orders;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_invoices') THEN
    DELETE FROM public.purchase_invoices;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'goods_receipts') THEN
    DELETE FROM public.goods_receipts;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_orders') THEN
    DELETE FROM public.purchase_orders;
  END IF;

  -- ============================================================
  -- STEP 4: Clear stock levels
  -- ============================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_levels_by_location') THEN
    DELETE FROM public.stock_levels_by_location;
  END IF;

  -- ============================================================
  -- STEP 5: Clear returnable items master
  -- ============================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'returnable_items') THEN
    DELETE FROM public.returnable_items;
  END IF;

  -- ============================================================
  -- STEP 6: Clear products
  -- ============================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    DELETE FROM public.products;
  END IF;

  -- ============================================================
  -- STEP 7: Clear customers, vendors, business executives, suppliers
  -- ============================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
    DELETE FROM public.customers;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vendors') THEN
    DELETE FROM public.vendors;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'business_executives') THEN
    DELETE FROM public.business_executives;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'suppliers') THEN
    DELETE FROM public.suppliers;
  END IF;

  -- ============================================================
  -- STEP 8: Clear user preferences
  -- ============================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_preferences') THEN
    DELETE FROM public.user_preferences;
  END IF;

  -- ============================================================
  -- STEP 9: Clear locations and companies last (parent tables)
  -- ============================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'locations') THEN
    DELETE FROM public.locations;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies') THEN
    DELETE FROM public.companies;
  END IF;

  RAISE NOTICE 'All data cleared successfully. Tables are empty and ready for manual data entry.';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Data clear operation encountered an issue: %', SQLERRM;
    RAISE;
END $$;
