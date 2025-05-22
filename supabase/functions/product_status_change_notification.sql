
-- ======================== IMPORTANT NOTICE ========================
-- This file contains critical database trigger functionality.
-- DO NOT EDIT unless absolutely necessary!
-- 
-- Any changes may affect the product notification system that sends
-- messages to Telegram. This system is currently working properly.
-- 
-- Version: 1.0.0
-- Last Verified Working: 2025-05-22
-- ================================================================

-- Создаем объединенную улучшенную функцию для уведомлений о товарах
CREATE OR REPLACE FUNCTION public.notify_on_product_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Отправляем уведомление когда:
  -- 1. При обновлении: статус меняется на active
  -- 2. При обновлении: статус меняется на sold
  -- 3. Прошло не менее 5 минут с последнего уведомления или его еще не было
  IF (TG_OP = 'UPDATE' AND 
      ((OLD.status != 'active' AND NEW.status = 'active') OR 
       (OLD.status != 'sold' AND NEW.status = 'sold'))) AND
     (NEW.last_notification_sent_at IS NULL OR 
      NEW.last_notification_sent_at < NOW() - INTERVAL '5 minutes') THEN
    
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

-- Удаляем старые триггеры
DROP TRIGGER IF EXISTS trigger_notify_on_status_change_to_active ON public.products;
DROP TRIGGER IF EXISTS trigger_notify_on_new_active_product ON public.products;
DROP TRIGGER IF EXISTS trigger_notify_on_product_status_changes ON public.products;

-- Создаем новый объединенный триггер
-- Меняем с BEFORE на AFTER, чтобы дать транзакции завершиться и все связанные данные сохраниться
CREATE TRIGGER trigger_notify_on_product_status_changes
AFTER INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_product_status_changes();

-- Очищаем старые функции, которые больше не используются
DROP FUNCTION IF EXISTS public.notify_on_status_change_to_active() CASCADE;
DROP FUNCTION IF EXISTS public.notify_on_active_product() CASCADE;
DROP FUNCTION IF EXISTS public.notify_on_new_active_product() CASCADE;

-- Создаем функцию для уведомлений при изменении статуса продукта в заказах
CREATE OR REPLACE FUNCTION public.notify_on_order_product_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Только при создании заказа с привязкой к продукту
  -- отправляем уведомление о смене статуса продукта на sold
  IF NEW.product_id IS NOT NULL AND TG_OP = 'INSERT' THEN
    -- Изменяем порядок операций:
    -- 1. Сначала сбрасываем timestamp последнего уведомления, чтобы уведомление точно отправилось
    -- 2. Затем обновляем статус продукта на sold
    UPDATE public.products
    SET last_notification_sent_at = NULL  
    WHERE id = NEW.product_id 
    AND status != 'sold';
    
    -- Теперь обновляем статус продукта на sold в отдельном запросе
    UPDATE public.products
    SET status = 'sold'
    WHERE id = NEW.product_id 
    AND status != 'sold';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Создаем триггер для функции уведомлений при заказах
CREATE TRIGGER trigger_notify_on_order_product_status_changes
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_order_product_status_changes();
