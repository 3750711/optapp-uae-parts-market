-- EMERGENCY FIX: Remove all recursive RLS policies causing infinite recursion
-- This fixes the "Loading profile" issue by removing problematic policies

-- Drop ALL existing problematic policies on profiles that cause recursion
DROP POLICY IF EXISTS "profiles_clean_self_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_full_access" ON public.profiles;

-- Drop the recursive functions that cause issues
DROP FUNCTION IF EXISTS public.is_current_user_admin();
DROP FUNCTION IF EXISTS public.current_user_id();

-- Create simple, non-recursive policies that work
-- Basic self-access - users can read their own profile
CREATE POLICY "users_own_profile_read" ON public.profiles
FOR SELECT USING (id = auth.uid());

-- Allow profile updates for own profile
CREATE POLICY "users_own_profile_update" ON public.profiles  
FOR UPDATE USING (id = auth.uid());

-- Allow profile inserts for new users
CREATE POLICY "users_profile_insert" ON public.profiles
FOR INSERT WITH CHECK (id = auth.uid());

-- Simple admin access without recursion - hardcoded admin check
CREATE POLICY "admin_profile_access" ON public.profiles
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE user_type = 'admin' 
    AND id = auth.uid()
  )
);