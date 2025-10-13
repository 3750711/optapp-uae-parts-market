-- Remove email_confirmed check from prevent_sensitive_field_changes
-- This allows system triggers to update email_confirmed during registration
-- Direct user changes are still prevented by RLS policies

CREATE OR REPLACE FUNCTION public.prevent_sensitive_field_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if user is admin
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) THEN
    RETURN NEW;
  END IF;

  -- Prevent opt_id changes (only admins can change)
  IF OLD.opt_id IS DISTINCT FROM NEW.opt_id THEN
    RAISE EXCEPTION 'Only administrators can change opt_id';
  END IF;

  -- Note: email_confirmed is intentionally not checked here
  -- It is managed by system triggers and RLS policies already prevent direct user changes
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.prevent_sensitive_field_changes() IS 
'Prevents non-admin users from changing sensitive fields. email_confirmed excluded as it is managed by system triggers.';