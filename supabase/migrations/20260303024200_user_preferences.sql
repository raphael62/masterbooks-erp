-- Migration: user_preferences table for theme settings
-- Timestamp: 20260303024200

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  theme_id TEXT NOT NULL DEFAULT 'purple',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_theme_id ON public.user_preferences(theme_id);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_preferences" ON public.user_preferences;
CREATE POLICY "users_manage_own_preferences"
ON public.user_preferences
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "anon_read_preferences" ON public.user_preferences;
CREATE POLICY "anon_read_preferences"
ON public.user_preferences
FOR SELECT
TO public
USING (true);
