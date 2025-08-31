-- EMERGENCY FIX: Fix the recursive function without dropping it
-- This preserves existing policies while fixing the recursion issue

-- Create a non-recursive version of is_current_user_admin that avoids profiles table lookup
-- Use the auth.jwt() approach to get user metadata directly
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  -- Use auth metadata instead of querying profiles to avoid recursion
  SELECT (auth.jwt() -> 'user_metadata' ->> 'user_type') = 'admin'
     OR auth.uid() IN (
       '7596f09c-b6a4-4d12-b2b5-12fe9aed9370',  -- Known admin IDs
       'f0d2b725-2619-4835-9248-1d212e29aa79'   -- Add more as needed
     );
$$;

-- Also fix current_user_id to be simpler
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT auth.uid();
$$;

-- Remove problematic policies that were added in previous migrations
DROP POLICY IF EXISTS "profiles_clean_self_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_full_access" ON public.profiles;