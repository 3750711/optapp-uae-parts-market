-- Fix RLS policy conflict for admin user updates
-- Update the "Users can update own profile with validation" policy to exclude administrators

-- Drop existing policy
DROP POLICY IF EXISTS "Users can update own profile with validation" ON public.profiles;

-- Recreate policy with exclusion for administrators
CREATE POLICY "Users can update own profile with validation" ON public.profiles
FOR UPDATE USING (
  ((id = auth.uid()) AND validate_profile_update(id, user_type, verification_status, is_trusted_seller) AND NOT is_current_user_admin())
)
WITH CHECK (
  ((id = auth.uid()) AND validate_profile_update(id, user_type, verification_status, is_trusted_seller) AND NOT is_current_user_admin())
);