
-- 1) Добавляем отметку об отправке админ-уведомления
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS admin_new_user_notified_at timestamptz;

-- 2) Переписываем функцию уведомления админов о новом пользователе
CREATE OR REPLACE FUNCTION public.notify_admins_new_pending_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Отправляем только если профиль действительно готов и еще не уведомляли
  IF NEW.verification_status = 'pending'
     AND COALESCE(NEW.profile_completed, false) = true
     AND NEW.opt_id IS NOT NULL
     AND TRIM(COALESCE(NEW.full_name, '')) <> ''
     AND COALESCE(NEW.accepted_terms, false) = true
     AND COALESCE(NEW.accepted_privacy, false) = true
     AND NEW.admin_new_user_notified_at IS NULL
  THEN
    -- Вызов Edge Function (как и раньше)
    PERFORM
      net.http_post(
        url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/notify-admins-new-user',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
        body:=jsonb_build_object(
          'userId', NEW.id,
          'fullName', COALESCE(NEW.full_name, 'Неизвестно'),
          'email', NEW.email,
          'userType', NEW.user_type,
          'phone', NEW.phone,
          'optId', NEW.opt_id,
          'telegram', NEW.telegram,
          'createdAt', NEW.created_at
        )
      );

    -- Помечаем, что уведомление отправлено (чтобы не дублировать)
    UPDATE public.profiles
      SET admin_new_user_notified_at = now()
      WHERE id = NEW.id;

    RAISE LOG 'Admin new user notification sent for user %', NEW.id;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in admin new user notification trigger: %', SQLERRM;
    RETURN NEW; -- Не валим транзакцию при сбое уведомления
END;
$$;

-- 3) Удаляем дублирующиеся триггеры и оставляем один
DROP TRIGGER IF EXISTS trigger_notify_admins_new_pending_user ON public.profiles;
DROP TRIGGER IF EXISTS trg_notify_admins_new_pending_user ON public.profiles;

CREATE TRIGGER trg_notify_admins_new_pending_user
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_pending_user();
