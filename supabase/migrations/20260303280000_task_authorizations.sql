-- Task Authorizations Migration
-- Creates task_authorizations table for real-time authorization requests

CREATE TABLE IF NOT EXISTS public.task_authorizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID,
    requester_name TEXT NOT NULL,
    module TEXT NOT NULL,
    action_type TEXT NOT NULL,
    record_id TEXT,
    record_ref TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_authorizations_status ON public.task_authorizations(status);
CREATE INDEX IF NOT EXISTS idx_task_authorizations_requester_id ON public.task_authorizations(requester_id);
CREATE INDEX IF NOT EXISTS idx_task_authorizations_created_at ON public.task_authorizations(created_at DESC);

ALTER TABLE public.task_authorizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_authorizations_open_access" ON public.task_authorizations;
CREATE POLICY "task_authorizations_open_access" ON public.task_authorizations
    FOR ALL TO public USING (true) WITH CHECK (true);

-- Enable real-time for task_authorizations
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_authorizations;
