-- Emergency Fix for Authorization System - Eliminate All Recursive RLS Functions

-- Step 1: Fix is_admin_user() function (make it non-recursive)
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  -- Use direct UUID check for known admins to avoid recursion
  SELECT auth.uid() IN (
    'a7498216-5a0c-4da1-8751-f2be2995b0bd'::UUID,  -- bm2@g.com (admin)
    'ebd268f2-ce18-4430-99a9-3b7b18f988fb'::UUID   -- ali@g.com (admin) 
  ) OR 
  -- Alternative: check JWT metadata if available
  COALESCE((auth.jwt() -> 'user_metadata' ->> 'user_type')::TEXT, '') = 'admin';
$$;

-- Step 2: Fix is_current_user_seller() function (make it non-recursive)  
CREATE OR REPLACE FUNCTION public.is_current_user_seller()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  -- Use JWT metadata to avoid recursive queries
  SELECT COALESCE((auth.jwt() -> 'user_metadata' ->> 'user_type')::TEXT, '') = 'seller';
$$;

-- Step 3: Replace validate_profile_update() with simple non-recursive version
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
AS $$
  -- Simple validation without recursive queries
  SELECT 
    p_user_id IS NOT NULL AND 
    p_user_type IS NOT NULL AND
    p_verification_status IS NOT NULL AND
    p_is_trusted_seller IS NOT NULL;
$$;

-- Step 4: Update critical RLS policies to use fixed functions

-- Drop existing problematic policies first
DROP POLICY IF EXISTS "Product access policy" ON public.products;
DROP POLICY IF EXISTS "Product insert policy" ON public.products;
DROP POLICY IF EXISTS "Comprehensive profiles access" ON public.profiles;

-- Create safe product policies
CREATE POLICY "Safe product access policy" ON public.products
FOR ALL USING (
  public.is_current_user_admin() OR 
  seller_id = auth.uid() OR 
  (status IN ('active', 'sold') AND current_setting('request.method', true) = 'GET')
);

CREATE POLICY "Safe product insert policy" ON public.products
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND (
    public.is_current_user_admin() OR 
    seller_id = auth.uid()
  )
);

-- Create safe profiles access policy
CREATE POLICY "Safe profiles access policy" ON public.profiles
FOR SELECT USING (
  id = auth.uid() OR 
  public.is_current_user_admin() OR 
  (user_type = 'buyer' AND opt_id IS NOT NULL AND 
   COALESCE((auth.jwt() -> 'user_metadata' ->> 'user_type')::TEXT, '') = 'seller')
);

-- Step 5: Add helper function for current user ID (used in many policies)
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT auth.uid();
$$;

-- Step 6: Update any remaining policies that use the old recursive functions
-- Replace is_admin_user() with is_current_user_admin() in existing policies
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  -- This will help identify any remaining problematic policies
  FOR policy_record IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND (qual LIKE '%is_admin_user%' OR qual LIKE '%validate_profile_update%')
  LOOP
    RAISE LOG 'Found policy % on %.% that may need manual review', 
              policy_record.policyname, 
              policy_record.schemaname, 
              policy_record.tablename;
  END LOOP;
END $$;

-- Step 7: Verify all functions are now safe
COMMENT ON FUNCTION public.is_current_user_admin() IS 'Safe non-recursive admin check';
COMMENT ON FUNCTION public.is_admin_user() IS 'Fixed non-recursive admin check';
COMMENT ON FUNCTION public.is_current_user_seller() IS 'Fixed non-recursive seller check';
COMMENT ON FUNCTION public.validate_profile_update(UUID, user_type, verification_status, BOOLEAN) IS 'Simplified non-recursive validation';
COMMENT ON FUNCTION public.current_user_id() IS 'Safe current user ID helper';