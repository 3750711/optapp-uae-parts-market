-- CRITICAL: Revert problematic RLS changes to restore website functionality
-- This migration removes the changes that blocked website access

-- First, restore basic RLS policies that were working
DROP POLICY IF EXISTS "Ultra safe profiles access policy" ON public.profiles;

-- Restore simple, working profile access policies
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (
  id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )
);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING (
  id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )
);

-- Fix the admin function to include the missing admin UUID
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT id IN (
    'f0d2b725-2619-4835-9248-1d212e29aa79'::uuid,  -- ts2@g.com (MISSING ADMIN)
    '550e8400-e29b-41d4-a716-446655440000'::uuid   -- other admin if exists
  ) 
  FROM public.profiles 
  WHERE id = auth.uid() 
  AND user_type = 'admin';
$$;

-- Ensure other critical functions work properly
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT auth.uid();
$$;

-- Simple seller check function
CREATE OR REPLACE FUNCTION public.is_current_user_seller()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'seller'
  );
$$;