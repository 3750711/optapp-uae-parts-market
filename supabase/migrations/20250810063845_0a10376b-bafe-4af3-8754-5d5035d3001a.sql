
-- Админская функция для повторной отправки welcome-сообщения
-- Удаляет предыдущие "sent" записи и инициирует повторную отправку через edge-функцию
CREATE OR REPLACE FUNCTION public.admin_resend_welcome(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_is_admin boolean := false;
  v_tg_id bigint;
  v_deleted int := 0;
BEGIN
  -- Проверка: только админ
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
      AND user_type = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only admins can resend welcome messages';
  END IF;

  -- Берем telegram_id пользователя
  SELECT telegram_id INTO v_tg_id
  FROM public.profiles
  WHERE id = p_user_id;

  -- Сбрасываем "sent" записи приветственного сообщения
  DELETE FROM public.telegram_notifications_log
  WHERE notification_type = 'welcome_registration'
    AND status = 'sent'
    AND (
      recipient_identifier = p_user_id::text
      OR (v_tg_id IS NOT NULL AND recipient_identifier = v_tg_id::text)
    );
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  -- Инициируем повторную отправку через Edge Function
  PERFORM
    net.http_post(
      url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/notify-user-welcome-registration',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
      body:=jsonb_build_object('userId', p_user_id)
    );

  RETURN json_build_object(
    'deleted', v_deleted,
    'triggered', true
  );
END;
$$;
