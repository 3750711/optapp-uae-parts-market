-- Create trigger function to automatically confirm email for Telegram users
CREATE OR REPLACE FUNCTION public.set_telegram_email_confirmed()
RETURNS trigger AS $$
BEGIN
  -- If auth method is Telegram, automatically confirm email
  IF NEW.auth_method = 'telegram' THEN
    NEW.email_confirmed = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on profiles table
CREATE TRIGGER telegram_email_confirm_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_telegram_email_confirmed();

-- Update existing Telegram users to have confirmed emails
UPDATE public.profiles 
SET email_confirmed = true 
WHERE auth_method = 'telegram' AND email_confirmed IS NOT true;