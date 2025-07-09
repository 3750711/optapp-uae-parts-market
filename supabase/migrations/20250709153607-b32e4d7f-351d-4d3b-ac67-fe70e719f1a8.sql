-- Create trigger function to set email_confirmed to false for new users
CREATE OR REPLACE FUNCTION public.set_new_user_email_unconfirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Set email_confirmed to false for new users when profile is created
  NEW.email_confirmed := false;
  RETURN NEW;
END;
$function$;

-- Create trigger on profiles table for INSERT operations
DROP TRIGGER IF EXISTS trigger_set_new_user_email_unconfirmed ON public.profiles;
CREATE TRIGGER trigger_set_new_user_email_unconfirmed
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_new_user_email_unconfirmed();