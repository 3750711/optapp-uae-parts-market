-- ======================== ВАЖНОЕ ОБНОВЛЕНИЕ ========================
-- Исправление логики триггера для обработки INSERT операций
-- и добавление детального логирования для диагностики проблем
-- 
-- Version: 1.2.0
-- Last Updated: 2025-07-24
-- ================================================================

-- Обновляем функцию уведомлений о товарах с улучшенной логикой
CREATE OR REPLACE FUNCTION public.notify_on_product_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Детальное логирование для диагностики
  RAISE LOG 'notify_on_product_status_changes triggered: operation=%, product_id=%, old_status=%, new_status=%', 
    TG_OP, NEW.id, 
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE 'N/A' END, 
    NEW.status;

  -- Отправляем уведомление когда:
  -- 1. При INSERT: товар создается сразу со статусом active (доверенные пользователи)
  -- 2. При UPDATE: статус меняется на active
  -- 3. При UPDATE: статус меняется на sold
  IF ((TG_OP = 'INSERT' AND NEW.status = 'active') OR
      (TG_OP = 'UPDATE' AND 
       ((OLD.status != 'active' AND NEW.status = 'active') OR 
        (OLD.status != 'sold' AND NEW.status = 'sold')))) THEN
    
    RAISE LOG 'notification condition met for product %, checking throttling and images...', NEW.id;
    
    -- Для уведомлений о продаже проверяем, не отправлялось ли недавно (30 секунд)
    IF (NEW.status = 'sold' AND 
        NEW.last_notification_sent_at IS NOT NULL AND 
        NEW.last_notification_sent_at > NOW() - INTERVAL '30 seconds') THEN
      RAISE LOG 'skipping sold notification for product % - throttled (last sent: %)', 
        NEW.id, NEW.last_notification_sent_at;
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
        has_images BOOLEAN;
      BEGIN
        -- Проверяем наличие изображений для логирования
        SELECT EXISTS(SELECT 1 FROM product_images WHERE product_id = NEW.id LIMIT 1) INTO has_images;
        
        IF NEW.status = 'sold' THEN
          notification_type := 'sold';
        ELSE
          notification_type := 'status_change';
        END IF;
        
        RAISE LOG 'sending % notification for product %, has_images=%, operation=%', 
          notification_type, NEW.id, has_images, TG_OP;
        
        -- Вызываем Edge Function для отправки уведомления
        PERFORM
          net.http_post(
            url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/send-telegram-notification',
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
            body:=json_build_object('productId', NEW.id, 'notificationType', notification_type)::jsonb
          );
          
        RAISE LOG 'edge function call completed for product %', NEW.id;
      END;
    ELSE
      -- Если изображений нет и это не уведомление о продаже, 
      -- сбрасываем timestamp, чтобы можно было попробовать отправить уведомление позже
      RAISE LOG 'no images found for product %, skipping notification and resetting timestamp', NEW.id;
      NEW.last_notification_sent_at := NULL;
    END IF;
  ELSE
    RAISE LOG 'notification condition not met for product %, operation=%, status=%', 
      NEW.id, TG_OP, NEW.status;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Пересоздаем триггер с поддержкой INSERT и UPDATE операций
DROP TRIGGER IF EXISTS trigger_notify_on_product_status_changes ON public.products;

CREATE TRIGGER trigger_notify_on_product_status_changes
AFTER INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_product_status_changes();