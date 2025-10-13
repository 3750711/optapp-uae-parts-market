-- Fix email_confirmed sync trigger to bypass RLS
-- This fixes "Database error updating user" during registration

-- Step 1: Fix trigger function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.sync_email_confirmed_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- Bypass RLS for system operations
SET search_path TO 'public'
AS $$
BEGIN
  -- Update profiles when auth.users.email_confirmed_at changes
  IF OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at THEN
    UPDATE public.profiles
    SET email_confirmed = (NEW.email_confirmed_at IS NOT NULL)
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_email_confirmed_status() IS 
'Syncs email_confirmed status from auth.users to profiles. Uses SECURITY DEFINER to bypass RLS.';

-- Step 2: Recreate trigger to use updated function
DROP TRIGGER IF EXISTS sync_email_confirmed_trigger ON auth.users;
CREATE TRIGGER sync_email_confirmed_trigger
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_email_confirmed_status();