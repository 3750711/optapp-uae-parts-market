
-- Добавляем поле is_modified в таблицу orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS is_modified BOOLEAN DEFAULT FALSE;

-- Обновляем все существующие заказы
UPDATE public.orders 
SET is_modified = FALSE 
WHERE is_modified IS NULL;

-- Удаляем старые функции с хешами
DROP FUNCTION IF EXISTS public.calculate_order_hash(uuid);

-- Создаем упрощенный триггер для отслеживания изменений
CREATE OR REPLACE FUNCTION public.track_order_modifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Устанавливаем is_modified = TRUE при любом UPDATE, кроме случаев когда:
  -- 1. Изменяется только само поле is_modified
  -- 2. Изменяется только last_notification_sent_at
  -- 3. Изменяется только last_notification_hash
  IF (TG_OP = 'UPDATE' AND 
      NOT (
        -- Проверяем, что изменились только служебные поля
        OLD.title IS NOT DISTINCT FROM NEW.title AND
        OLD.price IS NOT DISTINCT FROM NEW.price AND
        OLD.status IS NOT DISTINCT FROM NEW.status AND
        OLD.brand IS NOT DISTINCT FROM NEW.brand AND
        OLD.model IS NOT DISTINCT FROM NEW.model AND
        OLD.quantity IS NOT DISTINCT FROM NEW.quantity AND
        OLD.place_number IS NOT DISTINCT FROM NEW.place_number AND
        OLD.delivery_method IS NOT DISTINCT FROM NEW.delivery_method AND
        OLD.delivery_price_confirm IS NOT DISTINCT FROM NEW.delivery_price_confirm AND
        OLD.text_order IS NOT DISTINCT FROM NEW.text_order AND
        OLD.images IS NOT DISTINCT FROM NEW.images AND
        OLD.video_url IS NOT DISTINCT FROM NEW.video_url AND
        OLD.buyer_id IS NOT DISTINCT FROM NEW.buyer_id AND
        OLD.seller_id IS NOT DISTINCT FROM NEW.seller_id AND
        OLD.order_seller_name IS NOT DISTINCT FROM NEW.order_seller_name AND
        OLD.seller_opt_id IS NOT DISTINCT FROM NEW.seller_opt_id AND
        OLD.buyer_opt_id IS NOT DISTINCT FROM NEW.buyer_opt_id AND
        OLD.telegram_url_order IS NOT DISTINCT FROM NEW.telegram_url_order AND
        OLD.telegram_url_buyer IS NOT DISTINCT FROM NEW.telegram_url_buyer AND
        OLD.description IS NOT DISTINCT FROM NEW.description AND
        OLD.lot_number_order IS NOT DISTINCT FROM NEW.lot_number_order AND
        OLD.container_status IS NOT DISTINCT FROM NEW.container_status AND
        OLD.container_number IS NOT DISTINCT FROM NEW.container_number
      )) THEN
    NEW.is_modified = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Создаем триггер BEFORE UPDATE
DROP TRIGGER IF EXISTS track_order_modifications ON public.orders;
CREATE TRIGGER track_order_modifications
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION track_order_modifications();

-- Упрощаем функцию should_show_resend_button
CREATE OR REPLACE FUNCTION public.should_show_resend_button(p_order_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_can_resend BOOLEAN := FALSE;
  order_is_modified BOOLEAN := FALSE;
BEGIN
  -- Проверяем права пользователя
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = p_order_id
    AND (
      o.seller_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND user_type = 'admin'
      )
    )
  ) INTO user_can_resend;
  
  -- Если нет прав - кнопку не показываем
  IF NOT user_can_resend THEN
    RETURN FALSE;
  END IF;
  
  -- Проверяем, изменен ли заказ
  SELECT COALESCE(is_modified, FALSE)
  INTO order_is_modified
  FROM public.orders
  WHERE id = p_order_id;
  
  -- Показываем кнопку только если заказ изменен
  RETURN order_is_modified;
END;
$$;

-- Упрощаем функцию resend_order_notification
CREATE OR REPLACE FUNCTION public.resend_order_notification(p_order_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Проверяем права пользователя
  IF NOT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = p_order_id
    AND (
      o.seller_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND user_type = 'admin'
      )
    )
  ) THEN
    RAISE EXCEPTION 'Access denied to resend notification for order %', p_order_id;
  END IF;
  
  -- Проверяем, что заказ существует
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id = p_order_id) THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;
  
  -- После успешной отправки уведомления сбрасываем флаг изменений
  UPDATE public.orders
  SET 
    is_modified = FALSE,
    last_notification_sent_at = NOW()
  WHERE id = p_order_id;
  
  RETURN TRUE;
END;
$$;
