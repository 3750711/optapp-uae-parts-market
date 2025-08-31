-- FINAL FIX: Remove all auth.users references from RLS policies to prevent permission errors
-- This addresses the "permission denied for table users" error

-- Drop problematic policies that reference auth.users
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create completely safe profile policies without auth.users references
CREATE POLICY "Safe profile view policy" ON public.profiles
FOR SELECT USING (
  id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles admin_check
    WHERE admin_check.id = auth.uid() 
    AND admin_check.user_type = 'admin'
  )
);

CREATE POLICY "Safe profile update policy" ON public.profiles
FOR UPDATE USING (
  id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles admin_check
    WHERE admin_check.id = auth.uid() 
    AND admin_check.user_type = 'admin'
  )
);

-- Fix the admin function to use correct UUID for ali@g.com
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
    AND id IN (
      'f0d2b725-2619-4835-9248-1d212e29aa79'::uuid,  -- ts2@g.com
      'ebd268f2-ce18-4430-99a9-3b7b18f988fb'::uuid   -- ali@g.com (current user having issues)
    )
  );
$$;

-- Update other functions to be safe
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_seller()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'seller'
  );
$$;