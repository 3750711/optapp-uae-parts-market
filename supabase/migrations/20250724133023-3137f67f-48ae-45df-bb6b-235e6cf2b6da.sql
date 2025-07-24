-- 4. Add audit trigger for sensitive profile changes
CREATE OR REPLACE FUNCTION public.audit_sensitive_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Log any changes to sensitive fields
  IF (OLD.user_type IS DISTINCT FROM NEW.user_type OR
      OLD.verification_status IS DISTINCT FROM NEW.verification_status OR
      OLD.is_trusted_seller IS DISTINCT FROM NEW.is_trusted_seller) THEN
    
    INSERT INTO public.event_logs (
      action_type,
      entity_type,
      entity_id,
      user_id,
      details
    ) VALUES (
      'sensitive_profile_change',
      'profile',
      NEW.id,
      auth.uid(),
      json_build_object(
        'old_user_type', OLD.user_type,
        'new_user_type', NEW.user_type,
        'old_verification_status', OLD.verification_status,
        'new_verification_status', NEW.verification_status,
        'old_is_trusted_seller', OLD.is_trusted_seller,
        'new_is_trusted_seller', NEW.is_trusted_seller,
        'changed_by', auth.uid()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the audit trigger
DROP TRIGGER IF EXISTS audit_sensitive_profile_changes_trigger ON public.profiles;
CREATE TRIGGER audit_sensitive_profile_changes_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_sensitive_profile_changes();

-- 5. Strengthen RLS policies to prevent client-side bypasses
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can update own profile or admin access" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile with restrictions" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- Create a validation function that prevents unauthorized sensitive field changes
CREATE OR REPLACE FUNCTION public.validate_profile_update(
  p_user_id UUID,
  p_new_user_type user_type,
  p_new_verification_status verification_status,
  p_new_is_trusted_seller BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_profile RECORD;
  is_admin BOOLEAN;
BEGIN
  -- Get current profile data
  SELECT user_type, verification_status, is_trusted_seller
  INTO current_profile
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Check if current user is admin
  SELECT public.is_current_user_admin() INTO is_admin;
  
  -- If admin, allow all changes
  IF is_admin THEN
    RETURN TRUE;
  END IF;
  
  -- For non-admins, check if sensitive fields are being changed
  IF (current_profile.user_type IS DISTINCT FROM p_new_user_type OR
      current_profile.verification_status IS DISTINCT FROM p_new_verification_status OR
      current_profile.is_trusted_seller IS DISTINCT FROM p_new_is_trusted_seller) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Create restrictive policy for regular users
CREATE POLICY "Users can update own profile with validation" ON public.profiles
FOR UPDATE USING (
  id = auth.uid() AND 
  public.validate_profile_update(id, user_type, verification_status, is_trusted_seller)
) WITH CHECK (
  id = auth.uid() AND
  public.validate_profile_update(id, user_type, verification_status, is_trusted_seller)
);

-- Create separate policy for admin updates  
CREATE POLICY "Admins can update any profile" ON public.profiles
FOR UPDATE USING (
  public.is_current_user_admin()
) WITH CHECK (
  public.is_current_user_admin()
);