
-- Создаем объединенную улучшенную функцию для уведомлений о товарах
CREATE OR REPLACE FUNCTION public.notify_on_product_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Отправляем уведомление только если:
  -- 1. При обновлении: статус меняется на active
  -- 2. При создании: не отправляем уведомление (это будет делаться явно в коде)
  -- 3. Прошло не менее 5 минут с последнего уведомления или его еще не было
  IF (TG_OP = 'UPDATE' AND OLD.status != 'active' AND NEW.status = 'active') AND
     (NEW.last_notification_sent_at IS NULL OR 
      NEW.last_notification_sent_at < NOW() - INTERVAL '5 minutes') THEN
    
    -- Обновляем timestamp последнего уведомления
    NEW.last_notification_sent_at := NOW();
    
    -- Вызываем Edge Function для отправки уведомления
    PERFORM
      net.http_post(
        url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/send-telegram-notification',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
        body:=json_build_object('productId', NEW.id)::jsonb
      );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Удаляем старые триггеры
DROP TRIGGER IF EXISTS trigger_notify_on_status_change_to_active ON public.products;
DROP TRIGGER IF EXISTS trigger_notify_on_new_active_product ON public.products;

-- Создаем новый объединенный триггер
-- Меняем с BEFORE на AFTER, чтобы дать транзакции завершиться и все связанные данные сохраниться
CREATE TRIGGER trigger_notify_on_product_status_changes
AFTER UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_product_status_changes();

-- Очищаем старые функции, которые больше не используются
DROP FUNCTION IF EXISTS public.notify_on_status_change_to_active() CASCADE;
DROP FUNCTION IF EXISTS public.notify_on_active_product() CASCADE;
DROP FUNCTION IF EXISTS public.notify_on_new_active_product() CASCADE;
