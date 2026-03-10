-- ============================================================
-- CLEAR ALL DUMMY DATA - Remove all seed/dummy data from system
-- Keeps table structures intact. Deletes in FK-safe order (children first).
-- Run this migration to reset the database to an empty state.
-- ============================================================

DO $$
BEGIN

  -- ============================================================
  -- STEP 1: Transaction/movement tables (deepest children)
  -- ============================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'returnable_transactions') THEN
    DELETE FROM public.returnable_transactions;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_movements') THEN
    DELETE FROM public.stock_movements;
  END IF;

  -- ============================================================
  -- STEP 2: Invoice/order line items
  -- ============================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales_invoice_items') THEN
    DELETE FROM public.sales_invoice_items;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_invoice_items') THEN
    DELETE FROM public.purchase_invoice_items;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'supplier_payment_allocations') THEN
    DELETE FROM public.supplier_payment_allocations;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'supplier_ledger') THEN
    DELETE FROM public.supplier_ledger;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'goods_receipt_items') THEN
    DELETE FROM public.goods_receipt_items;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_order_items') THEN
    DELETE FROM public.purchase_order_items;
  END IF;

  -- ============================================================
  -- STEP 3: Empties items
  -- ============================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'empties_receive_items') THEN
    DELETE FROM public.empties_receive_items;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'empties_dispatch_items') THEN
    DELETE FROM public.empties_dispatch_items;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'empties_open_market_items') THEN
    DELETE FROM public.empties_open_market_items;
  END IF;

  -- ============================================================
  -- STEP 4: Price list items
  -- ============================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'price_list_items') THEN
    DELETE FROM public.price_list_items;
  END IF;

  -- ============================================================
  -- STEP 5: Other line-item tables
  -- ============================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'material_issue_items') THEN
    DELETE FROM public.material_issue_items;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bom_items') THEN
    DELETE FROM public.bom_items;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'production_order_items') THEN
    DELETE FROM public.production_order_items;
  END IF;

  -- ============================================================
  -- STEP 6: Invoices and orders (headers)
  -- ============================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales_invoices') THEN
    DELETE FROM public.sales_invoices;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_invoices') THEN
    DELETE FROM public.purchase_invoices;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'supplier_payments') THEN
    DELETE FROM public.supplier_payments;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales_orders') THEN
    DELETE FROM public.sales_orders;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'goods_receipts') THEN
    DELETE FROM public.goods_receipts;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_orders') THEN
    DELETE FROM public.purchase_orders;
  END IF;

  -- ============================================================
  -- STEP 7: Empties headers
  -- ============================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'empties_receive_header') THEN
    DELETE FROM public.empties_receive_header;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'empties_dispatch_header') THEN
    DELETE FROM public.empties_dispatch_header;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'empties_open_market_header') THEN
    DELETE FROM public.empties_open_market_header;
  END IF;

  -- ============================================================
  -- STEP 8: Price lists
  -- ============================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'price_list_headers') THEN
    DELETE FROM public.price_list_headers;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'price_lists') THEN
    DELETE FROM public.price_lists;
  END IF;

  -- ============================================================
  -- STEP 9: Stock, material issues, BOMs, production
  -- ============================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stock_levels_by_location') THEN
    DELETE FROM public.stock_levels_by_location;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'material_issues') THEN
    DELETE FROM public.material_issues;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bom_headers') THEN
    DELETE FROM public.bom_headers;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'production_orders') THEN
    DELETE FROM public.production_orders;
  END IF;

  -- ============================================================
  -- STEP 10: Returnable items master
  -- ============================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'returnable_items') THEN
    DELETE FROM public.returnable_items;
  END IF;

  -- ============================================================
  -- STEP 11: Audit logs
  -- ============================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    DELETE FROM public.audit_logs;
  END IF;

  -- ============================================================
  -- STEP 12: Products
  -- ============================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    DELETE FROM public.products;
  END IF;

  -- ============================================================
  -- STEP 13: Customers, vendors, suppliers, executives
  -- ============================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
    DELETE FROM public.customers;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vendors') THEN
    DELETE FROM public.vendors;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'suppliers') THEN
    DELETE FROM public.suppliers;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'business_executives') THEN
    DELETE FROM public.business_executives;
  END IF;

  -- ============================================================
  -- STEP 14: User preferences, task auths, targets, notifications
  -- ============================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_preferences') THEN
    DELETE FROM public.user_preferences;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'task_authorizations') THEN
    DELETE FROM public.task_authorizations;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vsr_monthly_targets') THEN
    DELETE FROM public.vsr_monthly_targets;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ssr_monthly_targets') THEN
    DELETE FROM public.ssr_monthly_targets;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notification_settings') THEN
    DELETE FROM public.notification_settings;
  END IF;

  -- ============================================================
  -- STEP 15: Roles and permissions (seed data)
  -- ============================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'role_permissions') THEN
    DELETE FROM public.role_permissions;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'roles') THEN
    DELETE FROM public.roles;
  END IF;

  -- ============================================================
  -- STEP 16: Tax rates, payment accounts
  -- ============================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tax_rates') THEN
    DELETE FROM public.tax_rates;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_accounts') THEN
    DELETE FROM public.payment_accounts;
  END IF;

  -- ============================================================
  -- STEP 17: Chart of accounts
  -- ============================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chart_of_accounts') THEN
    DELETE FROM public.chart_of_accounts;
  END IF;

  -- ============================================================
  -- STEP 18: Lookup tables (categories, UoM, empties types, price types)
  -- ============================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_categories') THEN
    DELETE FROM public.product_categories;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'units_of_measure') THEN
    DELETE FROM public.units_of_measure;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'empties_types') THEN
    DELETE FROM public.empties_types;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'price_types') THEN
    DELETE FROM public.price_types;
  END IF;

  -- ============================================================
  -- STEP 19: Locations and companies (top-level parents)
  -- ============================================================
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'locations') THEN
    DELETE FROM public.locations;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'companies') THEN
    DELETE FROM public.companies;
  END IF;

  RAISE NOTICE 'All dummy data cleared successfully. Tables are empty and ready for real data.';

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Clear dummy data failed: %', SQLERRM;
    RAISE;
END $$;
