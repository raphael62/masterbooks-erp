-- Migration: Payment Accounts, Tax Rates, Roles & Permissions
-- Timestamp: 20260303230100

-- ============================================================
-- PAYMENT ACCOUNTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payment_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_code TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL DEFAULT 'Cash',
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
    rate NUMERIC NOT NULL DEFAULT 0,
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
    description TEXT,
    user_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Active',
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_name ON public.roles(role_name);
CREATE INDEX IF NOT EXISTS idx_roles_status ON public.roles(status);

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
    admin_id UUID;
    manager_id UUID;
    cashier_id UUID;
    sales_rep_id UUID;
    warehouse_id UUID;
    accountant_id UUID;
    modules TEXT[] := ARRAY['Dashboard','Purchases','Sales','Inventory','Customers','Vendors','Reports','Preferences'];
    m TEXT;
BEGIN
    -- Insert default roles
    INSERT INTO public.roles (id, role_name, description, is_system, status)
    VALUES
        (gen_random_uuid(), 'Admin', 'Full system access', true, 'Active'),
        (gen_random_uuid(), 'Manager', 'Management level access', true, 'Active'),
        (gen_random_uuid(), 'Cashier', 'POS and sales access', true, 'Active'),
        (gen_random_uuid(), 'Sales Rep', 'Sales module access', true, 'Active'),
        (gen_random_uuid(), 'Warehouse', 'Inventory and stock access', true, 'Active'),
        (gen_random_uuid(), 'Accountant', 'Finance and reports access', true, 'Active')
    ON CONFLICT DO NOTHING;

    -- Get role IDs
    SELECT id INTO admin_id FROM public.roles WHERE role_name = 'Admin' LIMIT 1;
    SELECT id INTO manager_id FROM public.roles WHERE role_name = 'Manager' LIMIT 1;
    SELECT id INTO cashier_id FROM public.roles WHERE role_name = 'Cashier' LIMIT 1;
    SELECT id INTO sales_rep_id FROM public.roles WHERE role_name = 'Sales Rep' LIMIT 1;
    SELECT id INTO warehouse_id FROM public.roles WHERE role_name = 'Warehouse' LIMIT 1;
    SELECT id INTO accountant_id FROM public.roles WHERE role_name = 'Accountant' LIMIT 1;

    -- Seed Admin permissions (all true)
    IF admin_id IS NOT NULL THEN
        FOREACH m IN ARRAY modules LOOP
            INSERT INTO public.role_permissions (role_id, module_name, can_view, can_create, can_edit, can_delete, can_export)
            VALUES (admin_id, m, true, true, true, true, true)
            ON CONFLICT (role_id, module_name) DO NOTHING;
        END LOOP;
    END IF;

    -- Seed Manager permissions (all except delete preferences)
    IF manager_id IS NOT NULL THEN
        FOREACH m IN ARRAY modules LOOP
            INSERT INTO public.role_permissions (role_id, module_name, can_view, can_create, can_edit, can_delete, can_export)
            VALUES (manager_id, m, true, true, true, CASE WHEN m = 'Preferences' THEN false ELSE true END, true)
            ON CONFLICT (role_id, module_name) DO NOTHING;
        END LOOP;
    END IF;

    -- Seed Cashier permissions
    IF cashier_id IS NOT NULL THEN
        FOREACH m IN ARRAY modules LOOP
            INSERT INTO public.role_permissions (role_id, module_name, can_view, can_create, can_edit, can_delete, can_export)
            VALUES (cashier_id, m,
                CASE WHEN m IN ('Dashboard','Sales','Customers') THEN true ELSE false END,
                CASE WHEN m IN ('Sales') THEN true ELSE false END,
                false, false, false)
            ON CONFLICT (role_id, module_name) DO NOTHING;
        END LOOP;
    END IF;

    -- Seed Sales Rep permissions
    IF sales_rep_id IS NOT NULL THEN
        FOREACH m IN ARRAY modules LOOP
            INSERT INTO public.role_permissions (role_id, module_name, can_view, can_create, can_edit, can_delete, can_export)
            VALUES (sales_rep_id, m,
                CASE WHEN m IN ('Dashboard','Sales','Customers','Inventory') THEN true ELSE false END,
                CASE WHEN m IN ('Sales') THEN true ELSE false END,
                CASE WHEN m IN ('Sales','Customers') THEN true ELSE false END,
                false,
                CASE WHEN m IN ('Sales') THEN true ELSE false END)
            ON CONFLICT (role_id, module_name) DO NOTHING;
        END LOOP;
    END IF;

    -- Seed Warehouse permissions
    IF warehouse_id IS NOT NULL THEN
        FOREACH m IN ARRAY modules LOOP
            INSERT INTO public.role_permissions (role_id, module_name, can_view, can_create, can_edit, can_delete, can_export)
            VALUES (warehouse_id, m,
                CASE WHEN m IN ('Dashboard','Inventory','Purchases') THEN true ELSE false END,
                CASE WHEN m IN ('Inventory') THEN true ELSE false END,
                CASE WHEN m IN ('Inventory') THEN true ELSE false END,
                false,
                CASE WHEN m IN ('Inventory') THEN true ELSE false END)
            ON CONFLICT (role_id, module_name) DO NOTHING;
        END LOOP;
    END IF;

    -- Seed Accountant permissions
    IF accountant_id IS NOT NULL THEN
        FOREACH m IN ARRAY modules LOOP
            INSERT INTO public.role_permissions (role_id, module_name, can_view, can_create, can_edit, can_delete, can_export)
            VALUES (accountant_id, m,
                CASE WHEN m IN ('Dashboard','Reports','Purchases','Sales') THEN true ELSE false END,
                false,
                false,
                false,
                CASE WHEN m IN ('Reports') THEN true ELSE false END)
            ON CONFLICT (role_id, module_name) DO NOTHING;
        END LOOP;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Seed data error: %', SQLERRM;
END $$;
