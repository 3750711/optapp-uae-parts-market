-- Этап 5-6: Добавление поля telegram_last_error и обновление механизма уведомлений

-- Добавляем поле telegram_last_error если его нет
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'telegram_last_error'
  ) THEN
    ALTER TABLE public.products 
    ADD COLUMN telegram_last_error text;
  END IF;
END $$;

-- Создаем функцию для сброса статуса уведомлений при изменении важных полей
CREATE OR REPLACE FUNCTION public.reset_notification_status_on_product_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Если изменились критичные поля (фото, название, цена), сбрасываем статус уведомления
  IF (OLD.preview_image_url IS DISTINCT FROM NEW.preview_image_url) OR
     (OLD.title IS DISTINCT FROM NEW.title) OR
     (OLD.price IS DISTINCT FROM NEW.price) OR
     (OLD.brand IS DISTINCT FROM NEW.brand) OR
     (OLD.model IS DISTINCT FROM NEW.model) THEN
    
    -- Сбрасываем только если статус был 'sent' или 'failed'
    IF NEW.telegram_notification_status IN ('sent', 'failed') THEN
      NEW.telegram_notification_status := 'not_sent';
      NEW.telegram_last_error := NULL;
      NEW.telegram_message_id := NULL;
      NEW.telegram_confirmed_at := NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Создаем триггер для автоматического сброса статуса
DROP TRIGGER IF EXISTS trigger_reset_notification_status ON public.products;
CREATE TRIGGER trigger_reset_notification_status
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.reset_notification_status_on_product_update();

-- Создаем индексы для быстрого поиска товаров по статусу уведомлений
CREATE INDEX IF NOT EXISTS idx_products_telegram_notification_status 
  ON public.products(telegram_notification_status) 
  WHERE telegram_notification_status IN ('pending', 'failed', 'not_sent');

CREATE INDEX IF NOT EXISTS idx_products_failed_notifications 
  ON public.products(telegram_notification_status, last_notification_sent_at) 
  WHERE telegram_notification_status = 'failed';

-- Комментарии для документации
COMMENT ON COLUMN public.products.telegram_notification_status IS 'Статус отправки уведомления в Telegram: not_sent, pending, sent, failed';
COMMENT ON COLUMN public.products.telegram_message_id IS 'ID сообщения в Telegram для подтверждения через webhook';
COMMENT ON COLUMN public.products.telegram_confirmed_at IS 'Время подтверждения публикации через Telegram webhook';
COMMENT ON COLUMN public.products.telegram_last_error IS 'Последняя ошибка при отправке уведомления в Telegram';