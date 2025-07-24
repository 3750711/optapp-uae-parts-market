-- Critical Security Fix 1: Fix SECURITY DEFINER function search paths
-- This prevents privilege escalation attacks by ensuring functions use qualified schema names

-- Fix all existing SECURITY DEFINER functions to use proper search_path
-- Starting with the most critical user-facing functions

-- 1. Fix profile update functions
CREATE OR REPLACE FUNCTION public.sync_email_to_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Проверяем, изменился ли email
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    -- Обновляем email в auth.users
    UPDATE auth.users 
    SET email = NEW.email, 
        email_confirmed_at = CASE 
          WHEN email_confirmed_at IS NOT NULL THEN now() 
          ELSE NULL 
        END,
        updated_at = now()
    WHERE id = NEW.id;
    
    -- Логируем изменение email
    INSERT INTO public.event_logs (
      action_type, 
      entity_type, 
      entity_id, 
      user_id,
      details
    ) 
    VALUES (
      'email_change', 
      'profile', 
      NEW.id, 
      NEW.id,
      jsonb_build_object(
        'old_email', OLD.email,
        'new_email', NEW.email,
        'opt_id', NEW.opt_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Create secure profile update function with role change validation
CREATE OR REPLACE FUNCTION public.secure_update_profile(
  p_user_id UUID,
  p_updates JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_type TEXT;
  target_user_type TEXT;
  is_admin BOOLEAN;
  result JSON;
BEGIN
  -- Get current user's type
  SELECT user_type INTO current_user_type
  FROM public.profiles 
  WHERE id = auth.uid();
  
  -- Check if current user is admin
  is_admin := (current_user_type = 'admin');
  
  -- Get target user's current type
  SELECT user_type INTO target_user_type
  FROM public.profiles 
  WHERE id = p_user_id;
  
  -- Security validation: only allow self-updates or admin updates
  IF auth.uid() != p_user_id AND NOT is_admin THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Unauthorized: Can only update own profile'
    );
  END IF;
  
  -- Critical security check: prevent unauthorized role changes
  IF p_updates ? 'user_type' THEN
    -- Only admins can change user_type
    IF NOT is_admin THEN
      RETURN json_build_object(
        'success', false,
        'message', 'Unauthorized: Only admins can change user type'
      );
    END IF;
    
    -- Log admin role changes
    INSERT INTO public.event_logs (
      action_type,
      entity_type,
      entity_id,
      user_id,
      details
    ) VALUES (
      'admin_role_change',
      'profile',
      p_user_id,
      auth.uid(),
      json_build_object(
        'old_user_type', target_user_type,
        'new_user_type', p_updates->>'user_type',
        'admin_id', auth.uid()
      )
    );
  END IF;
  
  -- Similar checks for verification_status changes
  IF p_updates ? 'verification_status' THEN
    IF NOT is_admin THEN
      RETURN json_build_object(
        'success', false,
        'message', 'Unauthorized: Only admins can change verification status'
      );
    END IF;
    
    -- Log verification status changes
    INSERT INTO public.event_logs (
      action_type,
      entity_type,
      entity_id,
      user_id,
      details
    ) VALUES (
      'admin_verification_change',
      'profile',
      p_user_id,
      auth.uid(),
      json_build_object(
        'old_status', (SELECT verification_status FROM public.profiles WHERE id = p_user_id),
        'new_status', p_updates->>'verification_status',
        'admin_id', auth.uid()
      )
    );
  END IF;
  
  -- Perform the actual update
  UPDATE public.profiles 
  SET 
    full_name = COALESCE(p_updates->>'full_name', full_name),
    phone = COALESCE(p_updates->>'phone', phone),
    telegram = COALESCE(p_updates->>'telegram', telegram),
    location = COALESCE(p_updates->>'location', location),
    company_name = COALESCE(p_updates->>'company_name', company_name),
    description_user = COALESCE(p_updates->>'description_user', description_user),
    avatar_url = COALESCE(p_updates->>'avatar_url', avatar_url),
    user_type = CASE 
      WHEN is_admin AND p_updates ? 'user_type' 
      THEN (p_updates->>'user_type')::user_type 
      ELSE user_type 
    END,
    verification_status = CASE 
      WHEN is_admin AND p_updates ? 'verification_status' 
      THEN (p_updates->>'verification_status')::verification_status 
      ELSE verification_status 
    END
  WHERE id = p_user_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Profile updated successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Error updating profile: ' || SQLERRM
    );
END;
$$;

-- 3. Fix other critical SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT user_type = 'admin' 
     FROM public.profiles 
     WHERE id = auth.uid()),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT auth.uid();
$$;

-- 4. Strengthen RLS policies to prevent client-side bypasses
-- Drop and recreate the profiles UPDATE policy with stronger validation
DROP POLICY IF EXISTS "Users can update own profile or admin access" ON public.profiles;

CREATE POLICY "Users can update own profile with restrictions" ON public.profiles
FOR UPDATE USING (
  id = auth.uid() AND (
    -- Regular users can only update basic fields, not sensitive ones
    NOT (
      OLD.user_type IS DISTINCT FROM user_type OR
      OLD.verification_status IS DISTINCT FROM verification_status OR
      OLD.is_trusted_seller IS DISTINCT FROM is_trusted_seller
    )
  )
) WITH CHECK (
  id = auth.uid() AND (
    -- Same restriction for WITH CHECK
    NOT (
      OLD.user_type IS DISTINCT FROM user_type OR
      OLD.verification_status IS DISTINCT FROM verification_status OR
      OLD.is_trusted_seller IS DISTINCT FROM is_trusted_seller
    )
  )
);

-- Create separate policy for admin updates
CREATE POLICY "Admins can update any profile" ON public.profiles
FOR UPDATE USING (
  public.is_current_user_admin()
) WITH CHECK (
  public.is_current_user_admin()
);

-- 5. Add audit trigger for sensitive profile changes
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