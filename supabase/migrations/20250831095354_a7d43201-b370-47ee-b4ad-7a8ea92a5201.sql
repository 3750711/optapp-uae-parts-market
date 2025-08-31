-- Ensure profiles table has clean RLS policies for self-access
-- Drop existing problematic policies that might block profile reading

-- Clean basic self-access policy for profiles
DROP POLICY IF EXISTS "profiles_clean_self_access" ON public.profiles;
CREATE POLICY "profiles_clean_self_access" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- Admin can read all profiles
DROP POLICY IF EXISTS "profiles_admin_full_access" ON public.profiles;
CREATE POLICY "profiles_admin_full_access" ON public.profiles
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.user_type = 'admin')
);

-- Ensure these functions exist and are secure
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT auth.uid();
$$;