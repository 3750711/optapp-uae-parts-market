-- Обновляем функцию notify_on_product_status_changes для использования functions_url()
CREATE OR REPLACE FUNCTION public.notify_on_product_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Отправляем уведомление только при изменении статуса на:
  -- 1. active (опубликован) - будет отправлено полное объявление с изображениями
  -- 2. sold (продан) - будет отправлено уведомление о продаже
  -- НЕ отправляем уведомления при изменении на pending (модерация)
  IF (TG_OP = 'UPDATE' AND 
      ((OLD.status != 'active' AND NEW.status = 'active') OR 
       (OLD.status != 'sold' AND NEW.status = 'sold'))) THEN
    
    -- Если статус изменился на sold, отправляем уведомление в любом случае, даже без изображений
    -- Для active статуса проверяем наличие изображений
    IF (NEW.status = 'sold' OR 
        (NEW.status = 'active' AND EXISTS (
          SELECT 1 FROM product_images WHERE product_id = NEW.id LIMIT 1
        ))) THEN
      -- Обновляем timestamp последнего уведомления
      NEW.last_notification_sent_at := NOW();
      
      -- Определяем тип уведомления
      DECLARE
        notification_type TEXT;
      BEGIN
        IF NEW.status = 'sold' THEN
          notification_type := 'sold';
        ELSIF NEW.status = 'active' THEN
          -- Для active статуса отправляем полное объявление, а не status_change
          notification_type := 'product_published';
        ELSE
          notification_type := 'status_change';
        END IF;
        
        -- Вызываем Edge Function для отправки уведомления используя functions_url()
        PERFORM
          net.http_post(
            url := public.functions_url('send-telegram-notification'),
            headers := '{"Content-Type": "application/json"}'::jsonb,
            body := jsonb_build_object('productId', NEW.id, 'notificationType', notification_type)
          );
      END;
    ELSE
      -- Если изображений нет для active статуса, сбрасываем timestamp
      NEW.last_notification_sent_at := NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;