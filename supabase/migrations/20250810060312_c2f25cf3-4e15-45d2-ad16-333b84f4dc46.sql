-- Create trigger function to call welcome notification edge function on profile insert/update
CREATE OR REPLACE FUNCTION public.notify_welcome_on_profile_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- On INSERT: call immediately (edge function will dedupe / pend if needed)
  IF TG_OP = 'INSERT' THEN
    PERFORM
      net.http_post(
        url := 'https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/notify-user-welcome-registration',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
        body := jsonb_build_object('userId', NEW.id)
      );
  ELSIF TG_OP = 'UPDATE' THEN
    -- Call when user_type changes or telegram_id becomes available/changes
    IF (OLD.user_type IS DISTINCT FROM NEW.user_type)
       OR (OLD.telegram_id IS DISTINCT FROM NEW.telegram_id AND NEW.telegram_id IS NOT NULL) THEN
      PERFORM
        net.http_post(
          url := 'https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/notify-user-welcome-registration',
          headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
          body := jsonb_build_object('userId', NEW.id)
        );
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error in notify_welcome_on_profile_change for user %: %', NEW.id, SQLERRM;
  RETURN NEW; -- do not block profile changes
END;
$$;

-- Create or replace triggers for INSERT and UPDATE
DROP TRIGGER IF EXISTS tr_profiles_notify_welcome_insert ON public.profiles;
CREATE TRIGGER tr_profiles_notify_welcome_insert
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.notify_welcome_on_profile_change();

DROP TRIGGER IF EXISTS tr_profiles_notify_welcome_update ON public.profiles;
CREATE TRIGGER tr_profiles_notify_welcome_update
AFTER UPDATE OF user_type, telegram_id ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.notify_welcome_on_profile_change();