-- Шаг 2.1: Добавляем QSTASH_TOKEN в app_settings
INSERT INTO public.app_settings (key, value, created_at, updated_at)
VALUES (
  'qstash_token',
  '', -- Будет заполнено администратором через UI или напрямую
  now(),
  now()
)
ON CONFLICT (key) DO NOTHING;

-- Шаг 2.2: Обновляем триггер для отправки товарных уведомлений через QStash
CREATE OR REPLACE FUNCTION public.notify_on_product_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  qstash_token TEXT;
  notification_type TEXT;
  qstash_url TEXT;
BEGIN
  -- Получаем QSTASH_TOKEN из app_settings
  SELECT value INTO qstash_token
  FROM public.app_settings
  WHERE key = 'qstash_token';

  -- Если токена нет или он пустой, пропускаем отправку
  IF qstash_token IS NULL OR qstash_token = '' THEN
    RAISE WARNING '[notify_on_product_status_changes] QSTASH_TOKEN not configured, skipping notification for product %', NEW.id;
    RETURN NEW;
  END IF;

  -- Определяем тип уведомления и условия отправки
  IF TG_OP = 'UPDATE' AND OLD.status != 'active' AND NEW.status = 'active' THEN
    notification_type := 'product_published';
    RAISE LOG '[notify_on_product_status_changes] Product % changed to active, queueing product_published notification', NEW.id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'sold' AND NEW.status = 'sold' THEN
    notification_type := 'sold';
    RAISE LOG '[notify_on_product_status_changes] Product % changed to sold, queueing sold notification', NEW.id;
  ELSE
    -- Не отправляем уведомления для других изменений статуса
    RETURN NEW;
  END IF;

  -- Проверяем наличие изображений только для product_published
  IF notification_type = 'product_published' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.product_images WHERE product_id = NEW.id LIMIT 1
    ) THEN
      RAISE WARNING '[notify_on_product_status_changes] Product % has no images, skipping notification', NEW.id;
      NEW.last_notification_sent_at := NULL;
      RETURN NEW;
    END IF;
  END IF;

  -- Формируем URL для QStash (используем telegram-repost-queue)
  qstash_url := 'https://qstash.upstash.io/v2/enqueue/telegram-repost-queue/' || 
                public.functions_url('upstash-repost-handler');

  -- Обновляем timestamp последнего уведомления
  NEW.last_notification_sent_at := NOW();

  -- Отправляем в QStash queue
  BEGIN
    PERFORM net.http_post(
      url := qstash_url,
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || qstash_token,
        'Content-Type', 'application/json',
        'Upstash-Retries', '3',
        'Upstash-Deduplication-Id', 'product-' || NEW.id || '-' || notification_type || '-' || extract(epoch from now())::text
      ),
      body := jsonb_build_object(
        'productId', NEW.id,
        'notificationType', notification_type
      )
    );
    
    RAISE LOG '[notify_on_product_status_changes] Successfully queued % notification for product % via QStash', notification_type, NEW.id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[notify_on_product_status_changes] Failed to queue % notification for product %: %', notification_type, NEW.id, SQLERRM;
    -- Не возвращаем ошибку, чтобы не блокировать обновление продукта
  END;

  RETURN NEW;
END;
$$;

-- Пересоздаем триггер (на случай если нужно изменить timing)
DROP TRIGGER IF EXISTS trigger_notify_on_product_status_changes ON public.products;

CREATE TRIGGER trigger_notify_on_product_status_changes
AFTER UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_product_status_changes();

-- Комментарий для документации
COMMENT ON FUNCTION public.notify_on_product_status_changes() IS 
'Отправляет товарные уведомления (product_published, sold) в QStash очередь telegram-repost-queue. Требует настройки qstash_token в app_settings.';
