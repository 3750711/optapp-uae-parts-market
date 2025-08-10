
BEGIN;

CREATE OR REPLACE FUNCTION public.notify_welcome_on_profile_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  already_sent boolean;
  cond_now boolean;
  cond_prev boolean;
BEGIN
  -- Текущее состояние "профиль полностью готов" (после обновления)
  cond_now := 
    COALESCE(NEW.profile_completed, false) = true
    AND NEW.verification_status = 'pending'::verification_status
    AND NEW.user_type IN ('seller', 'buyer')
    AND COALESCE(NEW.accepted_terms, false) = true
    AND COALESCE(NEW.accepted_privacy, false) = true
    AND (
      NEW.user_type <> 'seller'
      OR (
        COALESCE(NULLIF(TRIM(NEW.company_name), ''), NULL) IS NOT NULL
        AND COALESCE(NULLIF(TRIM(NEW.opt_id), ''), NULL) IS NOT NULL
      )
    );

  -- Предыдущее состояние "профиль полностью готов" (до обновления)
  cond_prev := 
    COALESCE(OLD.profile_completed, false) = true
    AND OLD.verification_status = 'pending'::verification_status
    AND OLD.user_type IN ('seller', 'buyer')
    AND COALESCE(OLD.accepted_terms, false) = true
    AND COALESCE(OLD.accepted_privacy, false) = true
    AND (
      OLD.user_type <> 'seller'
      OR (
        COALESCE(NULLIF(TRIM(OLD.company_name), ''), NULL) IS NOT NULL
        AND COALESCE(NULLIF(TRIM(OLD.opt_id), ''), NULL) IS NOT NULL
      )
    );

  -- Отправляем только в момент "первого достижения" всех условий
  IF cond_now AND NOT cond_prev THEN
    -- Дополнительная защита от дублей: проверяем логи
    SELECT EXISTS (
      SELECT 1 
      FROM public.telegram_notifications_log
      WHERE related_entity_id = NEW.id::text
        AND notification_type = 'welcome_registration'
        AND status = 'sent'
    ) INTO already_sent;

    IF NOT already_sent THEN
      PERFORM
        net.http_post(
          url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/notify-user-welcome-registration',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
          body:=jsonb_build_object('userId', NEW.id)
        );

      RAISE LOG 'Welcome notification requested (full profile ready) for user %, type=%', NEW.id, NEW.user_type;
    ELSE
      RAISE LOG 'Welcome notification already sent earlier for user %, skipping', NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Пересоздаем триггер: он будет срабатывать при изменении полей, влияющих на готовность профиля
DROP TRIGGER IF EXISTS tr_notify_welcome_on_profile_completion ON public.profiles;

CREATE TRIGGER tr_notify_welcome_on_profile_completion
AFTER UPDATE ON public.profiles
FOR EACH ROW
WHEN (
  -- реагируем на любые изменения ключевых полей
  COALESCE(OLD.profile_completed, false) IS DISTINCT FROM COALESCE(NEW.profile_completed, false)
  OR OLD.verification_status IS DISTINCT FROM NEW.verification_status
  OR OLD.user_type IS DISTINCT FROM NEW.user_type
  OR COALESCE(OLD.accepted_terms, false) IS DISTINCT FROM COALESCE(NEW.accepted_terms, false)
  OR COALESCE(OLD.accepted_privacy, false) IS DISTINCT FROM COALESCE(NEW.accepted_privacy, false)
  OR COALESCE(NULLIF(TRIM(OLD.company_name), ''), NULL) IS DISTINCT FROM COALESCE(NULLIF(TRIM(NEW.company_name), ''), NULL)
  OR COALESCE(NULLIF(TRIM(OLD.opt_id), ''), NULL) IS DISTINCT FROM COALESCE(NULLIF(TRIM(NEW.opt_id), ''), NULL)
)
EXECUTE FUNCTION public.notify_welcome_on_profile_completion();

COMMIT;
