
BEGIN;

CREATE OR REPLACE FUNCTION public.notify_welcome_on_profile_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Отправляем только когда профиль завершён и пользователь в статусе ожидания
  IF COALESCE(OLD.profile_completed, false) = false
     AND COALESCE(NEW.profile_completed, false) = true
     AND NEW.verification_status = 'pending'::verification_status THEN

    PERFORM
      net.http_post(
        url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/notify-user-welcome-registration',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
        body:=jsonb_build_object('userId', NEW.id)
      );

    RAISE LOG 'Welcome notification requested for user % on profile completion', NEW.id;
  END IF;

  RETURN NEW;
END;
$function$;

-- Пересоздаём триггер на обновление профиля
DROP TRIGGER IF EXISTS tr_notify_welcome_on_profile_completion ON public.profiles;

CREATE TRIGGER tr_notify_welcome_on_profile_completion
AFTER UPDATE ON public.profiles
FOR EACH ROW
WHEN (COALESCE(OLD.profile_completed, false) IS DISTINCT FROM COALESCE(NEW.profile_completed, false))
EXECUTE FUNCTION public.notify_welcome_on_profile_completion();

COMMIT;
