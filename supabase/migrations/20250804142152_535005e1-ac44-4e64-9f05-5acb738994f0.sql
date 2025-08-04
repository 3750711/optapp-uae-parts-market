-- Temporarily drop the RLS policy that depends on validate_profile_update
DROP POLICY IF EXISTS "Users can update own profile with validation" ON public.profiles;

-- Drop and recreate the validate_profile_update function
DROP FUNCTION IF EXISTS public.validate_profile_update(uuid,user_type,verification_status,boolean);

-- Create new validate_profile_update function that allows Telegram profile completion
CREATE OR REPLACE FUNCTION public.validate_profile_update(
  p_user_id uuid,
  p_new_user_type user_type,
  p_new_verification_status verification_status,
  p_new_is_trusted_seller boolean
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  current_profile RECORD;
  is_admin_user boolean;
BEGIN
  -- Get current profile data
  SELECT * INTO current_profile
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Check if current user is admin
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) INTO is_admin_user;
  
  -- Admins can update anything
  IF is_admin_user THEN
    RETURN true;
  END IF;
  
  -- If profile is not completed yet (Telegram users finishing registration)
  IF current_profile.profile_completed = false THEN
    -- Allow setting user_type and verification_status during initial completion
    RETURN true;
  END IF;
  
  -- For completed profiles, apply existing restrictions
  
  -- Prevent changing user_type after initial setup
  IF current_profile.user_type IS DISTINCT FROM p_new_user_type THEN
    RAISE EXCEPTION 'Cannot change user type after profile completion';
  END IF;
  
  -- Only admins can change verification_status for completed profiles
  IF current_profile.verification_status IS DISTINCT FROM p_new_verification_status THEN
    RAISE EXCEPTION 'Cannot change verification status';
  END IF;
  
  -- Only admins can change trusted seller status for completed profiles
  IF current_profile.is_trusted_seller IS DISTINCT FROM p_new_is_trusted_seller THEN
    RAISE EXCEPTION 'Cannot change trusted seller status';
  END IF;
  
  RETURN true;
END;
$$;

-- Recreate the RLS policy with the updated function
CREATE POLICY "Users can update own profile with validation" ON public.profiles
FOR UPDATE USING (
  (id = auth.uid()) AND 
  validate_profile_update(id, user_type, verification_status, is_trusted_seller) AND 
  (NOT is_current_user_admin())
)
WITH CHECK (
  (id = auth.uid()) AND 
  validate_profile_update(id, user_type, verification_status, is_trusted_seller) AND 
  (NOT is_current_user_admin())
);