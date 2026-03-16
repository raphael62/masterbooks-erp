-- Inventory Change History Templates: run in Supabase Dashboard → SQL Editor
-- Creates templates and template_grants tables with RLS (per-user read allowed templates, CRUD own).

-- 1. Templates table (requires public.roles to exist for template_grants.role_id)
CREATE TABLE IF NOT EXISTS public.inventory_change_history_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  column_settings JSONB NOT NULL DEFAULT '[]',
  sort_subtotal_settings JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inv_change_tpl_created_by ON public.inventory_change_history_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_inv_change_tpl_is_default ON public.inventory_change_history_templates(is_default) WHERE is_default = true;

-- 2. Template grants (who can use a template: by user_id and/or role_id)
CREATE TABLE IF NOT EXISTS public.inventory_change_history_template_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.inventory_change_history_templates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT at_least_one_grant CHECK (user_id IS NOT NULL OR role_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_inv_change_grants_template ON public.inventory_change_history_template_grants(template_id);
CREATE INDEX IF NOT EXISTS idx_inv_change_grants_user ON public.inventory_change_history_template_grants(user_id);
CREATE INDEX IF NOT EXISTS idx_inv_change_grants_role ON public.inventory_change_history_template_grants(role_id);

-- 3. RLS on templates
ALTER TABLE public.inventory_change_history_templates ENABLE ROW LEVEL SECURITY;

-- Users can read templates they created or have a grant for (grants checked in app or via view)
DROP POLICY IF EXISTS "inv_change_tpl_select_own" ON public.inventory_change_history_templates;
CREATE POLICY "inv_change_tpl_select_own" ON public.inventory_change_history_templates
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR id IN (
      SELECT template_id FROM public.inventory_change_history_template_grants g
      WHERE g.user_id = auth.uid()
         OR g.role_id IN (SELECT role_id FROM public.user_roles WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "inv_change_tpl_insert_own" ON public.inventory_change_history_templates;
CREATE POLICY "inv_change_tpl_insert_own" ON public.inventory_change_history_templates
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "inv_change_tpl_update_own" ON public.inventory_change_history_templates;
CREATE POLICY "inv_change_tpl_update_own" ON public.inventory_change_history_templates
  FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "inv_change_tpl_delete_own" ON public.inventory_change_history_templates;
CREATE POLICY "inv_change_tpl_delete_own" ON public.inventory_change_history_templates
  FOR DELETE TO authenticated USING (created_by = auth.uid());

-- 4. Helper: check template ownership without triggering templates RLS (avoids recursion)
-- Must be SECURITY DEFINER so it bypasses RLS on templates when used by template_grants policies.
CREATE OR REPLACE FUNCTION public.inv_change_tpl_owned_by_me(tid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.inventory_change_history_templates t WHERE t.id = tid AND t.created_by = auth.uid());
$$;

-- 5. RLS on template_grants: template owner can manage grants for their templates (use function to avoid recursion)
ALTER TABLE public.inventory_change_history_template_grants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inv_change_grants_select" ON public.inventory_change_history_template_grants;
CREATE POLICY "inv_change_grants_select" ON public.inventory_change_history_template_grants
  FOR SELECT TO authenticated
  USING (public.inv_change_tpl_owned_by_me(template_id));

DROP POLICY IF EXISTS "inv_change_grants_insert" ON public.inventory_change_history_template_grants;
CREATE POLICY "inv_change_grants_insert" ON public.inventory_change_history_template_grants
  FOR INSERT TO authenticated
  WITH CHECK (public.inv_change_tpl_owned_by_me(template_id));

DROP POLICY IF EXISTS "inv_change_grants_delete" ON public.inventory_change_history_template_grants;
CREATE POLICY "inv_change_grants_delete" ON public.inventory_change_history_template_grants
  FOR DELETE TO authenticated
  USING (public.inv_change_tpl_owned_by_me(template_id));

-- 6. Trigger to keep updated_at
CREATE OR REPLACE FUNCTION public.inv_change_tpl_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS inv_change_tpl_updated_at ON public.inventory_change_history_templates;
CREATE TRIGGER inv_change_tpl_updated_at
  BEFORE UPDATE ON public.inventory_change_history_templates
  FOR EACH ROW EXECUTE FUNCTION public.inv_change_tpl_updated_at();
