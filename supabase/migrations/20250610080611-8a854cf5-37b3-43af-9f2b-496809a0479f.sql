
-- Обновляем функцию для уведомлений о товарах
CREATE OR REPLACE FUNCTION public.notify_on_product_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Сбрасываем timestamp при изменении статуса на active
  -- чтобы разрешить новые уведомления о продаже
  IF (TG_OP = 'UPDATE' AND OLD.status != 'active' AND NEW.status = 'active') THEN
    NEW.last_notification_sent_at := NULL;
  END IF;
  
  -- Отправляем уведомление когда:
  -- 1. При INSERT: товар создается сразу со статусом active (доверенные пользователи)
  -- 2. При UPDATE: статус меняется на active
  -- 3. При UPDATE: статус меняется на sold (с защитой от дублей)
  IF ((TG_OP = 'INSERT' AND NEW.status = 'active') OR
      (TG_OP = 'UPDATE' AND 
       ((OLD.status != 'active' AND NEW.status = 'active') OR 
        (OLD.status != 'sold' AND NEW.status = 'sold')))) THEN
    
    -- Для уведомлений о продаже проверяем, не отправлялось ли недавно (30 секунд)
    IF (NEW.status = 'sold' AND 
        NEW.last_notification_sent_at IS NOT NULL AND 
        NEW.last_notification_sent_at > NOW() - INTERVAL '30 seconds') THEN
      -- Не отправляем повторное уведомление о продаже
      RETURN NEW;
    END IF;
    
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
        
        -- Вызываем Edge Function для отправки уведомления
        PERFORM
          net.http_post(
            url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/send-telegram-notification',
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
            body:=json_build_object('productId', NEW.id, 'notificationType', notification_type)::jsonb
          );
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
