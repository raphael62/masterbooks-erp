-- Migration: Payment Accounts, Tax Rates, Roles & Permissions
-- Timestamp: 20260303230000

-- ============================================================
-- PAYMENT ACCOUNTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payment_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'Bank',
  bank_name TEXT,
  account_number TEXT,
  branch TEXT,
  currency TEXT NOT NULL DEFAULT 'GHS',
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_accounts_code ON public.payment_accounts(account_code);
CREATE INDEX IF NOT EXISTS idx_payment_accounts_type ON public.payment_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_payment_accounts_status ON public.payment_accounts(status);

ALTER TABLE public.payment_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_accounts_all_access" ON public.payment_accounts;
CREATE POLICY "payment_accounts_all_access"
  ON public.payment_accounts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- TAX RATES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_code TEXT NOT NULL,
  tax_name TEXT NOT NULL,
  tax_type TEXT NOT NULL DEFAULT 'VAT',
  rate_percent NUMERIC NOT NULL DEFAULT 0,
  applies_to TEXT NOT NULL DEFAULT 'Both',
  effective_date DATE,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tax_rates_code ON public.tax_rates(tax_code);
CREATE INDEX IF NOT EXISTS idx_tax_rates_type ON public.tax_rates(tax_type);
CREATE INDEX IF NOT EXISTS idx_tax_rates_status ON public.tax_rates(status);

ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tax_rates_all_access" ON public.tax_rates;
CREATE POLICY "tax_rates_all_access"
  ON public.tax_rates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- ROLES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL,
  role_code TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_code ON public.roles(role_code);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "roles_all_access" ON public.roles;
CREATE POLICY "roles_all_access"
  ON public.roles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- ROLE PERMISSIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT false,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  can_export BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_role_permissions_role_module ON public.role_permissions(role_id, module_name);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "role_permissions_all_access" ON public.role_permissions;
CREATE POLICY "role_permissions_all_access"
  ON public.role_permissions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- SEED DEFAULT ROLES
-- ============================================================
DO $$
DECLARE
  admin_role_id UUID;
  manager_role_id UUID;
  cashier_role_id UUID;
  sales_rep_role_id UUID;
  warehouse_role_id UUID;
  accountant_role_id UUID;
  v_modules TEXT[] := ARRAY['Dashboard', 'Purchases', 'Sales', 'Inventory', 'Customers', 'Vendors', 'Reports', 'Preferences'];
  v_module TEXT;
BEGIN
  -- Insert default roles
  INSERT INTO public.roles (id, role_name, role_code, description, is_system, status)
  VALUES
    (gen_random_uuid(), 'Administrator', 'ADMIN', 'Full system access', true, 'Active'),
    (gen_random_uuid(), 'Manager', 'MANAGER', 'Management level access', true, 'Active'),
    (gen_random_uuid(), 'Cashier', 'CASHIER', 'POS and sales access', true, 'Active'),
    (gen_random_uuid(), 'Sales Representative', 'SALES_REP', 'Sales module access', true, 'Active'),
    (gen_random_uuid(), 'Warehouse Staff', 'WAREHOUSE', 'Inventory module access', true, 'Active'),
    (gen_random_uuid(), 'Accountant', 'ACCOUNTANT', 'Finance and reports access', true, 'Active')
  ON CONFLICT DO NOTHING;

  SELECT id INTO admin_role_id FROM public.roles WHERE role_code = 'ADMIN' LIMIT 1;
  SELECT id INTO manager_role_id FROM public.roles WHERE role_code = 'MANAGER' LIMIT 1;
  SELECT id INTO cashier_role_id FROM public.roles WHERE role_code = 'CASHIER' LIMIT 1;
  SELECT id INTO sales_rep_role_id FROM public.roles WHERE role_code = 'SALES_REP' LIMIT 1;
  SELECT id INTO warehouse_role_id FROM public.roles WHERE role_code = 'WAREHOUSE' LIMIT 1;
  SELECT id INTO accountant_role_id FROM public.roles WHERE role_code = 'ACCOUNTANT' LIMIT 1;

  -- Admin: full access to all modules
  IF admin_role_id IS NOT NULL THEN
    FOREACH v_module IN ARRAY v_modules LOOP
      INSERT INTO public.role_permissions (role_id, module_name, can_view, can_create, can_edit, can_delete, can_export)
      VALUES (admin_role_id, v_module, true, true, true, true, true)
      ON CONFLICT (role_id, module_name) DO NOTHING;
    END LOOP;
  END IF;

  -- Manager: view/create/edit/export, no delete
  IF manager_role_id IS NOT NULL THEN
    FOREACH v_module IN ARRAY v_modules LOOP
      INSERT INTO public.role_permissions (role_id, module_name, can_view, can_create, can_edit, can_delete, can_export)
      VALUES (manager_role_id, v_module, true, true, true, false, true)
      ON CONFLICT (role_id, module_name) DO NOTHING;
    END LOOP;
  END IF;

  -- Cashier: Sales + Dashboard only
  IF cashier_role_id IS NOT NULL THEN
    FOREACH v_module IN ARRAY v_modules LOOP
      INSERT INTO public.role_permissions (role_id, module_name, can_view, can_create, can_edit, can_delete, can_export)
      VALUES (cashier_role_id, v_module,
        v_module IN ('Dashboard', 'Sales', 'Customers'),
        v_module IN ('Sales'),
        false, false, false)
      ON CONFLICT (role_id, module_name) DO NOTHING;
    END LOOP;
  END IF;

  -- Sales Rep: Sales + Customers
  IF sales_rep_role_id IS NOT NULL THEN
    FOREACH v_module IN ARRAY v_modules LOOP
      INSERT INTO public.role_permissions (role_id, module_name, can_view, can_create, can_edit, can_delete, can_export)
      VALUES (sales_rep_role_id, v_module,
        v_module IN ('Dashboard', 'Sales', 'Customers'),
        v_module IN ('Sales'),
        v_module IN ('Sales', 'Customers'),
        false, v_module IN ('Sales', 'Reports'))
      ON CONFLICT (role_id, module_name) DO NOTHING;
    END LOOP;
  END IF;

  -- Warehouse: Inventory only
  IF warehouse_role_id IS NOT NULL THEN
    FOREACH v_module IN ARRAY v_modules LOOP
      INSERT INTO public.role_permissions (role_id, module_name, can_view, can_create, can_edit, can_delete, can_export)
      VALUES (warehouse_role_id, v_module,
        v_module IN ('Dashboard', 'Inventory'),
        v_module IN ('Inventory'),
        v_module IN ('Inventory'),
        false, false)
      ON CONFLICT (role_id, module_name) DO NOTHING;
    END LOOP;
  END IF;

  -- Accountant: Finance + Reports
  IF accountant_role_id IS NOT NULL THEN
    FOREACH v_module IN ARRAY v_modules LOOP
      INSERT INTO public.role_permissions (role_id, module_name, can_view, can_create, can_edit, can_delete, can_export)
      VALUES (accountant_role_id, v_module,
        v_module IN ('Dashboard', 'Reports', 'Purchases', 'Sales'),
        false, false, false,
        v_module IN ('Reports'))
      ON CONFLICT (role_id, module_name) DO NOTHING;
    END LOOP;
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Seed data error: %', SQLERRM;
END $$;
