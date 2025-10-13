-- Create function to prevent unauthorized changes to sensitive profile fields
CREATE OR REPLACE FUNCTION public.prevent_sensitive_field_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Check if current user is admin
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) INTO is_admin;
  
  -- Admins can change everything
  IF is_admin THEN
    RETURN NEW;
  END IF;
  
  -- === CRITICAL FIELDS - ONLY ADMIN CAN CHANGE ===
  
  -- User rights and statuses
  IF OLD.user_type IS DISTINCT FROM NEW.user_type THEN
    RAISE EXCEPTION 'Only administrators can change user_type';
  END IF;
  
  IF OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
    RAISE EXCEPTION 'Only administrators can change verification_status';
  END IF;
  
  IF OLD.is_trusted_seller IS DISTINCT FROM NEW.is_trusted_seller THEN
    RAISE EXCEPTION 'Only administrators can change is_trusted_seller';
  END IF;
  
  IF OLD.opt_status IS DISTINCT FROM NEW.opt_status THEN
    RAISE EXCEPTION 'Only administrators can change opt_status';
  END IF;
  
  -- Business metrics
  IF OLD.rating IS DISTINCT FROM NEW.rating THEN
    RAISE EXCEPTION 'Only administrators can change rating';
  END IF;
  
  IF OLD.communication_ability IS DISTINCT FROM NEW.communication_ability THEN
    RAISE EXCEPTION 'Only administrators can change communication_ability';
  END IF;
  
  -- System/technical fields
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    RAISE EXCEPTION 'Email can only be changed through Supabase Auth';
  END IF;
  
  IF OLD.email_confirmed IS DISTINCT FROM NEW.email_confirmed THEN
    RAISE EXCEPTION 'Only administrators can change email_confirmed';
  END IF;
  
  IF OLD.auth_method IS DISTINCT FROM NEW.auth_method THEN
    RAISE EXCEPTION 'Only administrators can change auth_method';
  END IF;
  
  IF OLD.telegram_id IS DISTINCT FROM NEW.telegram_id THEN
    RAISE EXCEPTION 'Only administrators can change telegram_id';
  END IF;
  
  IF OLD.admin_new_user_notified_at IS DISTINCT FROM NEW.admin_new_user_notified_at THEN
    RAISE EXCEPTION 'Only administrators can change admin_new_user_notified_at';
  END IF;
  
  IF OLD.has_password IS DISTINCT FROM NEW.has_password THEN
    RAISE EXCEPTION 'Only administrators can change has_password';
  END IF;
  
  IF OLD.public_share_token IS DISTINCT FROM NEW.public_share_token THEN
    RAISE EXCEPTION 'Only administrators can change public_share_token';
  END IF;
  
  IF OLD.listing_count IS DISTINCT FROM NEW.listing_count THEN
    RAISE EXCEPTION 'Only administrators can change listing_count';
  END IF;
  
  -- === SPECIAL CASES ===
  
  -- opt_id: Users can fill it ONCE if empty, then only admin can change
  IF OLD.opt_id IS NULL AND NEW.opt_id IS NOT NULL THEN
    -- Allow first-time filling
    NULL;
  ELSIF OLD.opt_id IS DISTINCT FROM NEW.opt_id THEN
    RAISE EXCEPTION 'Only administrators can change opt_id after it has been set';
  END IF;
  
  -- first_login_completed: Allow one-time change from false to true
  IF OLD.first_login_completed = false AND NEW.first_login_completed = true THEN
    -- Allow completion
    NULL;
  ELSIF OLD.first_login_completed IS DISTINCT FROM NEW.first_login_completed THEN
    RAISE EXCEPTION 'Only administrators can modify first_login_completed after completion';
  END IF;
  
  -- profile_completed: Allow one-time change from false to true
  IF OLD.profile_completed = false AND NEW.profile_completed = true THEN
    -- Allow completion
    NULL;
  ELSIF OLD.profile_completed IS DISTINCT FROM NEW.profile_completed THEN
    RAISE EXCEPTION 'Only administrators can modify profile_completed after completion';
  END IF;
  
  -- telegram_edit_count is managed by another trigger, don't interfere
  
  RETURN NEW;
END;
$$;

-- Create BEFORE UPDATE trigger on profiles table
DROP TRIGGER IF EXISTS trigger_prevent_sensitive_field_changes ON public.profiles;
CREATE TRIGGER trigger_prevent_sensitive_field_changes
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_sensitive_field_changes();