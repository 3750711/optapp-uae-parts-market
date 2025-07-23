
-- Fix infinite recursion in RLS policies for profiles table
-- Step 1: Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Sellers can view buyer profiles" ON public.profiles;

-- Step 2: Create a secure SECURITY DEFINER function to check user type
CREATE OR REPLACE FUNCTION public.is_current_user_seller()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'seller'
  );
$$;

-- Step 3: Update the existing policy to include seller access to buyer profiles
DROP POLICY IF EXISTS "Admin full access, user self-access" ON public.profiles;

-- Create new comprehensive policy that handles all access patterns safely
CREATE POLICY "Comprehensive profiles access" ON public.profiles
FOR SELECT USING (
  -- Users can see their own profile
  id = auth.uid() OR
  -- Admins can see all profiles
  is_admin_user() OR
  -- Sellers can see buyer profiles that have opt_id
  (user_type = 'buyer' AND opt_id IS NOT NULL AND is_current_user_seller())
);
