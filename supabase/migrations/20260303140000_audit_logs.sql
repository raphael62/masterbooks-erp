-- Audit Logs Migration
-- Creates audit_logs table and triggers for INSERT/UPDATE/DELETE on key tables

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    user_email TEXT,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    table_name TEXT NOT NULL,
    record_id TEXT,
    old_data JSONB,
    new_data JSONB,
    changed_fields JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON public.audit_logs(record_id);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_open_access" ON public.audit_logs;
CREATE POLICY "audit_logs_open_access" ON public.audit_logs
    FOR ALL TO public USING (true) WITH CHECK (true);

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION public.fn_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
    v_old_data JSONB := NULL;
    v_new_data JSONB := NULL;
    v_changed_fields JSONB := NULL;
    v_action TEXT;
    v_record_id TEXT;
    v_user_id UUID;
    v_user_email TEXT;
BEGIN
    v_action := TG_OP;

    -- Try to get current user from auth context
    BEGIN
        v_user_id := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    IF TG_OP = 'DELETE' THEN
        v_old_data := to_jsonb(OLD);
        v_record_id := (v_old_data->>'id')::TEXT;
        v_new_data := NULL;
        v_changed_fields := NULL;
    ELSIF TG_OP = 'INSERT' THEN
        v_new_data := to_jsonb(NEW);
        v_record_id := (v_new_data->>'id')::TEXT;
        v_old_data := NULL;
        v_changed_fields := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        v_record_id := (v_new_data->>'id')::TEXT;
        -- Compute changed fields
        SELECT jsonb_object_agg(key, jsonb_build_object('before', v_old_data->key, 'after', v_new_data->key))
        INTO v_changed_fields
        FROM jsonb_object_keys(v_new_data) AS key
        WHERE v_old_data->key IS DISTINCT FROM v_new_data->key
          AND key NOT IN ('updated_at', 'created_at');
    END IF;

    INSERT INTO public.audit_logs (
        user_id,
        user_email,
        action,
        table_name,
        record_id,
        old_data,
        new_data,
        changed_fields,
        created_at
    ) VALUES (
        v_user_id,
        v_user_email,
        v_action,
        TG_TABLE_NAME,
        v_record_id,
        v_old_data,
        v_new_data,
        v_changed_fields,
        CURRENT_TIMESTAMP
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$func$;

-- Attach triggers to key tables
DROP TRIGGER IF EXISTS audit_companies ON public.companies;
CREATE TRIGGER audit_companies
    AFTER INSERT OR UPDATE OR DELETE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS audit_locations ON public.locations;
CREATE TRIGGER audit_locations
    AFTER INSERT OR UPDATE OR DELETE ON public.locations
    FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS audit_products ON public.products;
CREATE TRIGGER audit_products
    AFTER INSERT OR UPDATE OR DELETE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS audit_customers ON public.customers;
CREATE TRIGGER audit_customers
    AFTER INSERT OR UPDATE OR DELETE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS audit_vendors ON public.vendors;
CREATE TRIGGER audit_vendors
    AFTER INSERT OR UPDATE OR DELETE ON public.vendors
    FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS audit_purchase_orders ON public.purchase_orders;
CREATE TRIGGER audit_purchase_orders
    AFTER INSERT OR UPDATE OR DELETE ON public.purchase_orders
    FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS audit_purchase_invoices ON public.purchase_invoices;
CREATE TRIGGER audit_purchase_invoices
    AFTER INSERT OR UPDATE OR DELETE ON public.purchase_invoices
    FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();
