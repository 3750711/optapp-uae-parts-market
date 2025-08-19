-- Fix the validate_profile_update function issue by dropping and recreating it properly
DROP FUNCTION IF EXISTS public.validate_profile_update(uuid, user_type, verification_status, boolean);

-- Create a function to validate profile updates and prevent privilege escalation
CREATE OR REPLACE FUNCTION public.validate_profile_update(
  p_user_id uuid,
  p_new_user_type user_type,
  p_new_verification_status verification_status,
  p_new_is_trusted_seller boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_type user_type;
  current_verification_status verification_status;
  current_is_trusted_seller boolean;
  is_admin boolean := false;
BEGIN
  -- Check if current user is admin
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) INTO is_admin;
  
  -- Admins can change anything
  IF is_admin THEN
    RETURN true;
  END IF;
  
  -- Users can only update their own profile
  IF p_user_id != auth.uid() THEN
    RETURN false;
  END IF;
  
  -- Get current values
  SELECT user_type, verification_status, is_trusted_seller
  INTO current_user_type, current_verification_status, current_is_trusted_seller
  FROM profiles 
  WHERE id = p_user_id;
  
  -- Non-admins cannot change sensitive fields
  IF current_user_type != p_new_user_type OR
     current_verification_status != p_new_verification_status OR
     current_is_trusted_seller != p_new_is_trusted_seller THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;