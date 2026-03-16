-- Fix infinite recursion in RLS: run in Supabase SQL Editor after create-inventory-change-history-templates.sql
-- Template SELECT policy reads template_grants; template_grants policies read templates → recursion.
-- Use a SECURITY DEFINER function so template_grants checks ownership without querying templates under RLS.

CREATE OR REPLACE FUNCTION public.inv_change_tpl_owned_by_me(tid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.inventory_change_history_templates t WHERE t.id = tid AND t.created_by = auth.uid());
$$;

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
