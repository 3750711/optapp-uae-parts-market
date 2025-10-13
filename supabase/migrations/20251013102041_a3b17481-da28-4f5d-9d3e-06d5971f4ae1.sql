-- Allow initial opt_id setup during registration
-- Users can set opt_id once (when NULL), but cannot change it after
-- Only admins can change opt_id after it has been set

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

  -- Allow initial opt_id setup (when OLD.opt_id IS NULL)
  -- Prevent opt_id changes after it has been set (only admins can change)
  IF OLD.opt_id IS NOT NULL AND NEW.opt_id IS DISTINCT FROM OLD.opt_id THEN
    RAISE EXCEPTION 'Only administrators can change opt_id after it has been set';
  END IF;

  -- Note: email_confirmed is intentionally not checked here
  -- It is managed by system triggers and RLS policies already prevent direct user changes
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.prevent_sensitive_field_changes() IS 
'Prevents non-admin users from changing sensitive fields after initial setup. Allows initial opt_id setup during registration, but blocks changes afterward.';