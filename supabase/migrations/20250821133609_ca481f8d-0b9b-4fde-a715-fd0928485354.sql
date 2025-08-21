-- Fix Telegram seller registration RLS issues
-- Step 1: Update validate_profile_update function to allow changes during initial registration

CREATE OR REPLACE FUNCTION public.validate_profile_update(
  user_id UUID,
  new_user_type user_type,
  new_verification_status verification_status,
  new_is_trusted_seller BOOLEAN
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_profile RECORD;
  is_admin_user BOOLEAN;
BEGIN
  -- Get current profile data
  SELECT user_type, verification_status, is_trusted_seller, profile_completed, auth_method
  INTO current_profile
  FROM public.profiles
  WHERE id = user_id;
  
  -- Check if current user is admin
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) INTO is_admin_user;
  
  -- Admins can make any changes
  IF is_admin_user THEN
    RETURN TRUE;
  END IF;
  
  -- Allow changes during initial profile completion (Telegram registration)
  IF current_profile.profile_completed = FALSE THEN
    -- During initial registration, allow all field changes
    RETURN TRUE;
  END IF;
  
  -- For completed profiles, prevent critical field changes by non-admins
  -- Prevent user_type changes
  IF current_profile.user_type IS DISTINCT FROM new_user_type THEN
    RAISE EXCEPTION 'Cannot change user type after profile completion. Contact administrator.';
  END IF;
  
  -- Prevent verification_status changes  
  IF current_profile.verification_status IS DISTINCT FROM new_verification_status THEN
    RAISE EXCEPTION 'Cannot change verification status. Contact administrator.';
  END IF;
  
  -- Prevent is_trusted_seller changes
  IF current_profile.is_trusted_seller IS DISTINCT FROM new_is_trusted_seller THEN
    RAISE EXCEPTION 'Cannot change trusted seller status. Contact administrator.';
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Step 2: Add specific RLS policy for Telegram registration completion
CREATE POLICY "Telegram users can complete registration" ON public.profiles
FOR UPDATE 
USING (
  id = auth.uid() 
  AND auth_method = 'telegram' 
  AND profile_completed = FALSE
)
WITH CHECK (
  id = auth.uid() 
  AND auth_method = 'telegram'
);

-- Step 3: Update the main update policy to be more permissive for incomplete profiles
DROP POLICY IF EXISTS "Users can update own profile with validation" ON public.profiles;

CREATE POLICY "Users can update own profile with validation" ON public.profiles
FOR UPDATE 
USING (
  id = auth.uid() 
  AND (
    -- Allow updates for incomplete profiles (initial registration)
    profile_completed = FALSE 
    OR 
    -- Or use validation function for completed profiles
    validate_profile_update(id, user_type, verification_status, is_trusted_seller)
  )
  AND NOT is_current_user_admin()
)
WITH CHECK (
  id = auth.uid() 
  AND (
    -- Allow updates for incomplete profiles (initial registration)
    profile_completed = FALSE 
    OR 
    -- Or use validation function for completed profiles
    validate_profile_update(id, user_type, verification_status, is_trusted_seller)
  )
  AND NOT is_current_user_admin()
);