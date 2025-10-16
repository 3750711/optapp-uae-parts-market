-- Пересоздаем функцию notify_on_product_status_changes с исправленной логикой
-- Исправления:
-- 1. Добавлена обработка INSERT операций
-- 2. Убрано изменение NEW.last_notification_sent_at (не работает в AFTER триггере)
-- 3. Добавлено подробное логирование для отладки
-- 4. Используется functions_url() для формирования URL (работа через прокси)

CREATE OR REPLACE FUNCTION public.notify_on_product_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_type TEXT;
  has_images BOOLEAN;
BEGIN
  -- Логируем срабатывание триггера
  RAISE LOG '[notify_on_product_status_changes] Trigger fired: operation=%, product_id=%, status=%', TG_OP, NEW.id, NEW.status;
  
  -- Для INSERT: отправляем уведомление если статус = 'active'
  IF TG_OP = 'INSERT' THEN
    RAISE LOG '[notify_on_product_status_changes] INSERT operation detected for product %', NEW.id;
    
    IF NEW.status = 'active' THEN
      -- Проверяем наличие изображений
      SELECT EXISTS (SELECT 1 FROM product_images WHERE product_id = NEW.id LIMIT 1) INTO has_images;
      
      IF has_images THEN
        notification_type := 'product_published';
        RAISE LOG '[notify_on_product_status_changes] Queued product_published notification for product %', NEW.id;
        
        -- Отправляем уведомление через прокси
        BEGIN
          PERFORM net.http_post(
            url := public.functions_url('/functions/v1/send-telegram-notification'),
            headers := '{"Content-Type": "application/json"}'::jsonb,
            body := jsonb_build_object('productId', NEW.id, 'notificationType', notification_type)
          );
          RAISE LOG '[notify_on_product_status_changes] ✅ Notification sent for product %', NEW.id;
        EXCEPTION WHEN OTHERS THEN
          RAISE LOG '[notify_on_product_status_changes] ❌ Error sending notification: %', SQLERRM;
        END;
      ELSE
        RAISE LOG '[notify_on_product_status_changes] ⚠️ No images found for product %, skipping notification', NEW.id;
      END IF;
    END IF;
  
  -- Для UPDATE: отправляем уведомление при изменении статуса
  ELSIF TG_OP = 'UPDATE' THEN
    RAISE LOG '[notify_on_product_status_changes] UPDATE operation: old_status=%, new_status=%', OLD.status, NEW.status;
    
    -- Проверяем изменение статуса на 'active' или 'sold'
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      IF NEW.status = 'active' THEN
        -- Для active проверяем наличие изображений
        SELECT EXISTS (SELECT 1 FROM product_images WHERE product_id = NEW.id LIMIT 1) INTO has_images;
        
        IF has_images THEN
          notification_type := 'product_published';
          RAISE LOG '[notify_on_product_status_changes] Product % changed to active, queued notification', NEW.id;
          
          -- Отправляем уведомление через прокси
          BEGIN
            PERFORM net.http_post(
              url := public.functions_url('/functions/v1/send-telegram-notification'),
              headers := '{"Content-Type": "application/json"}'::jsonb,
              body := jsonb_build_object('productId', NEW.id, 'notificationType', notification_type)
            );
            RAISE LOG '[notify_on_product_status_changes] ✅ Notification sent for product %', NEW.id;
          EXCEPTION WHEN OTHERS THEN
            RAISE LOG '[notify_on_product_status_changes] ❌ Error sending notification: %', SQLERRM;
          END;
        ELSE
          RAISE LOG '[notify_on_product_status_changes] ⚠️ No images for product %, skipping notification', NEW.id;
        END IF;
        
      ELSIF NEW.status = 'sold' THEN
        notification_type := 'sold';
        RAISE LOG '[notify_on_product_status_changes] Product % changed to sold, queued notification', NEW.id;
        
        -- Для sold отправляем без проверки изображений через прокси
        BEGIN
          PERFORM net.http_post(
            url := public.functions_url('/functions/v1/send-telegram-notification'),
            headers := '{"Content-Type": "application/json"}'::jsonb,
            body := jsonb_build_object('productId', NEW.id, 'notificationType', notification_type)
          );
          RAISE LOG '[notify_on_product_status_changes] ✅ Notification sent for product %', NEW.id;
        EXCEPTION WHEN OTHERS THEN
          RAISE LOG '[notify_on_product_status_changes] ❌ Error sending notification: %', SQLERRM;
        END;
      END IF;
    ELSE
      RAISE LOG '[notify_on_product_status_changes] Status unchanged, no notification needed';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;