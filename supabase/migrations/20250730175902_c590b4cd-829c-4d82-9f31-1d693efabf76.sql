-- Fix the notify_on_product_status_changes function to remove any references to telegram_notifications_queue
-- and ensure it only uses existing Edge Functions

DROP FUNCTION IF EXISTS public.notify_on_product_status_changes() CASCADE;

CREATE OR REPLACE FUNCTION public.notify_on_product_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Отправляем уведомление когда:
  -- 1. При обновлении: статус меняется на active
  -- 2. При обновлении: статус меняется на sold
  IF (TG_OP = 'UPDATE' AND 
      ((OLD.status != 'active' AND NEW.status = 'active') OR 
       (OLD.status != 'sold' AND NEW.status = 'sold'))) THEN
    
    -- Если статус изменился на sold, отправляем уведомление в любом случае, даже без изображений
    -- Иначе проверяем наличие изображений для других типов уведомлений
    IF (NEW.status = 'sold' OR EXISTS (
      SELECT 1 FROM product_images WHERE product_id = NEW.id LIMIT 1
    )) THEN
      -- Обновляем timestamp последнего уведомления
      NEW.last_notification_sent_at := NOW();
      
      -- Определяем тип уведомления
      DECLARE
        notification_type TEXT;
      BEGIN
        IF NEW.status = 'sold' THEN
          notification_type := 'sold';
        ELSE
          notification_type := 'status_change';
        END IF;
        
        -- Вызываем Edge Function для отправки уведомления через HTTP POST
        BEGIN
          PERFORM
            net.http_post(
              url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/send-telegram-notification',
              headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
              body:=json_build_object('productId', NEW.id, 'notificationType', notification_type)::jsonb
            );
        EXCEPTION WHEN OTHERS THEN
          -- Логируем ошибку, но не прерываем выполнение основной операции
          RAISE LOG 'Failed to send telegram notification for product %: %', NEW.id, SQLERRM;
        END;
      END;
    ELSE
      -- Если изображений нет и это не уведомление о продаже, 
      -- сбрасываем timestamp, чтобы можно было попробовать отправить уведомление позже
      NEW.last_notification_sent_at := NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Пересоздаем триггер
DROP TRIGGER IF EXISTS trigger_notify_on_product_status_changes ON public.products;

CREATE TRIGGER trigger_notify_on_product_status_changes
AFTER UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_product_status_changes();