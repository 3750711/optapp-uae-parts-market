-- Исправление дублирования уведомлений
-- Проблема: создаются два триггера (INSERT и UPDATE) которые оба вызывают функцию

-- 1. Удаляем дублирующий триггер созданный в предыдущей миграции
DROP TRIGGER IF EXISTS trigger_notify_on_new_product ON public.products;

-- 2. Пересоздаем функцию с правильной логикой для INSERT и UPDATE
CREATE OR REPLACE FUNCTION public.notify_on_product_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_type TEXT;
  should_notify BOOLEAN := FALSE;
BEGIN
  -- Определяем нужно ли отправлять уведомление
  IF TG_OP = 'INSERT' THEN
    -- Для новых товаров отправляем уведомление только если статус = 'active'
    IF NEW.status = 'active' AND EXISTS (
      SELECT 1 FROM product_images WHERE product_id = NEW.id LIMIT 1
    ) THEN
      should_notify := TRUE;
      notification_type := 'product_published';
      RAISE LOG '[notify_on_product_status_changes] New product % created with active status', NEW.id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Для обновлений отправляем уведомление при смене статуса на active или sold
    IF OLD.status != 'active' AND NEW.status = 'active' THEN
      IF EXISTS (SELECT 1 FROM product_images WHERE product_id = NEW.id LIMIT 1) THEN
        should_notify := TRUE;
        notification_type := 'product_published';
        RAISE LOG '[notify_on_product_status_changes] Product % changed to active', NEW.id;
      END IF;
    ELSIF OLD.status != 'sold' AND NEW.status = 'sold' THEN
      should_notify := TRUE;
      notification_type := 'sold';
      RAISE LOG '[notify_on_product_status_changes] Product % changed to sold', NEW.id;
    END IF;
  END IF;
  
  -- Если нужно отправить уведомление - вызываем Edge Function
  IF should_notify THEN
    RAISE LOG '[notify_on_product_status_changes] Queued % notification for product %', notification_type, NEW.id;
    
    PERFORM net.http_post(
      url := public.functions_url('send-telegram-notification'),
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object('productId', NEW.id, 'notificationType', notification_type)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Триггер уже существует с правильной конфигурацией (AFTER INSERT OR UPDATE)
-- Просто убеждаемся что он один
DROP TRIGGER IF EXISTS trigger_notify_on_product_status_changes ON public.products;

CREATE TRIGGER trigger_notify_on_product_status_changes
AFTER INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_product_status_changes();