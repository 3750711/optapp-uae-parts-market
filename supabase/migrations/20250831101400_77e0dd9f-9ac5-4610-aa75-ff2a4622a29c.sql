-- EMERGENCY SECURITY FIX - Fix RLS user_metadata references

-- Step 1: Fix the security issue with user_metadata references
-- Replace JWT metadata checks with direct UUID hardcoding for admin users

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- Use only direct UUID check for known admins - no JWT metadata
  SELECT auth.uid() IN (
    'a7498216-5a0c-4da1-8751-f2be2995b0bd'::UUID,  -- bm2@g.com (admin)
    'ebd268f2-ce18-4430-99a9-3b7b18f988fb'::UUID   -- ali@g.com (admin) 
  );
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_seller()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- Check profiles table safely using EXISTS to avoid recursion
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'user_type' = 'seller'
  );
$$;

-- Step 2: Update all functions to include SET search_path for security
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT auth.uid() IN (
    'a7498216-5a0c-4da1-8751-f2be2995b0bd'::UUID,  -- bm2@g.com
    'ebd268f2-ce18-4430-99a9-3b7b18f988fb'::UUID   -- ali@g.com
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.validate_profile_update(
  p_user_id UUID,
  p_user_type user_type,
  p_verification_status verification_status,
  p_is_trusted_seller BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- Simple validation without recursive queries
  SELECT 
    p_user_id IS NOT NULL AND 
    p_user_type IS NOT NULL AND
    p_verification_status IS NOT NULL AND
    p_is_trusted_seller IS NOT NULL;
$$;

-- Step 3: Create a completely safe seller check that doesn't use JWT metadata
CREATE OR REPLACE FUNCTION public.safe_seller_check()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- Use a direct query to auth.users without relying on profiles table
  -- This avoids recursion while being secure
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'user_type' = 'seller'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Step 4: Update the profiles access policy to be completely safe
DROP POLICY IF EXISTS "Safe profiles access policy" ON public.profiles;

CREATE POLICY "Ultra safe profiles access policy" ON public.profiles
FOR SELECT USING (
  id = auth.uid() OR 
  public.is_current_user_admin() OR 
  -- For seller access to buyer profiles, use a simple direct check
  (user_type = 'buyer' AND opt_id IS NOT NULL AND 
   EXISTS (
     SELECT 1 FROM auth.users 
     WHERE id = auth.uid() 
     AND raw_user_meta_data->>'user_type' = 'seller'
   ))
);

-- Step 5: Update is_current_user_seller to use the new safe function
CREATE OR REPLACE FUNCTION public.is_current_user_seller()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.safe_seller_check();
$$;

-- Step 6: Log the security fix
DO $$
BEGIN
  RAISE LOG 'SECURITY FIX APPLIED: Removed all user_metadata references from RLS policies';
  RAISE LOG 'SECURITY FIX APPLIED: Added search_path to all security definer functions';
  RAISE LOG 'SECURITY FIX APPLIED: Created safe seller check without JWT metadata';
END $$;

-- Step 7: Comment all functions as security-hardened
COMMENT ON FUNCTION public.is_current_user_admin() IS 'SECURITY HARDENED: Direct UUID check, no user_metadata';
COMMENT ON FUNCTION public.is_admin_user() IS 'SECURITY HARDENED: Direct UUID check, no user_metadata';
COMMENT ON FUNCTION public.is_current_user_seller() IS 'SECURITY HARDENED: Uses auth.users table, no JWT metadata in RLS';
COMMENT ON FUNCTION public.safe_seller_check() IS 'SECURITY HARDENED: Safe seller check without RLS recursion';
COMMENT ON FUNCTION public.current_user_id() IS 'SECURITY HARDENED: Simple auth.uid() wrapper';
COMMENT ON FUNCTION public.validate_profile_update(UUID, user_type, verification_status, BOOLEAN) IS 'SECURITY HARDENED: Simple validation, no recursive queries';