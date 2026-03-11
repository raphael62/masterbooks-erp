-- Run this in Supabase Dashboard → SQL Editor to create user_profiles and user_roles
-- Users won't appear in the app until these tables exist

-- 1. Create user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'User',
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_profile" ON public.user_profiles;
CREATE POLICY "users_read_own_profile" ON public.user_profiles FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "service_role_all_user_profiles" ON public.user_profiles;
CREATE POLICY "service_role_all_user_profiles" ON public.user_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "users_list_all_profiles" ON public.user_profiles;
CREATE POLICY "users_list_all_profiles" ON public.user_profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "users_update_own_profile" ON public.user_profiles;
CREATE POLICY "users_update_own_profile" ON public.user_profiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 2. Create user_roles (requires roles table to exist)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_all_authenticated" ON public.user_roles;
CREATE POLICY "user_roles_all_authenticated" ON public.user_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Trigger to auto-create profile on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, email, role, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'User'),
    NEW.email,
    'User',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Backfill: sync existing auth users into user_profiles
INSERT INTO public.user_profiles (id, full_name, email, role, updated_at)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1), 'User'), email, 'User', NOW()
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
  updated_at = NOW();
