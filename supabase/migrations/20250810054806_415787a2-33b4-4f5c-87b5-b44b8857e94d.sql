-- Create trigger to send welcome Telegram message after profile creation
-- Uses http_post to call the notify-user-welcome-registration edge function

-- Function to call edge function on new profile insert
CREATE OR REPLACE FUNCTION public.notify_on_user_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call edge function with the new user's ID
  PERFORM
    net.http_post(
      url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/notify-user-welcome-registration',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
      body:=jsonb_build_object('userId', NEW.id)
    );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Do not block user creation; just log and continue
  RAISE LOG 'Error posting welcome notification for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any to avoid duplicates
DROP TRIGGER IF EXISTS trg_notify_on_user_registration ON public.profiles;

-- Create trigger AFTER INSERT on profiles table
CREATE TRIGGER trg_notify_on_user_registration
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.notify_on_user_registration();