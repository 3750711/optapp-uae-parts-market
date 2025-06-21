
-- Добавляем поля для отслеживания уведомлений в таблицу orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS last_notification_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_notification_hash TEXT;

-- Создаем функцию для вычисления хеша заказа
CREATE OR REPLACE FUNCTION public.calculate_order_hash(p_order_id uuid)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_data TEXT;
  result_hash TEXT;
BEGIN
  -- Собираем ключевые данные заказа для хеширования
  SELECT CONCAT(
    'title:', COALESCE(title, ''),
    '|price:', COALESCE(price::text, ''),
    '|status:', COALESCE(status::text, ''),
    '|brand:', COALESCE(brand, ''),
    '|model:', COALESCE(model, ''),
    '|quantity:', COALESCE(quantity::text, ''),
    '|place_number:', COALESCE(place_number::text, ''),
    '|delivery_method:', COALESCE(delivery_method::text, ''),
    '|delivery_price:', COALESCE(delivery_price_confirm::text, ''),
    '|text_order:', COALESCE(text_order, ''),
    '|images:', COALESCE(array_to_string(images, ','), ''),
    '|videos:', COALESCE(array_to_string(video_url, ','), '')
  ) INTO order_data
  FROM public.orders
  WHERE id = p_order_id;
  
  -- Используем MD5 для создания хеша
  result_hash := MD5(order_data);
  
  RETURN result_hash;
END;
$$;

-- Создаем функцию для проверки необходимости показа кнопки повторной отправки
CREATE OR REPLACE FUNCTION public.should_show_resend_button(p_order_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_hash TEXT;
  stored_hash TEXT;
  last_sent TIMESTAMP WITH TIME ZONE;
  user_can_resend BOOLEAN := FALSE;
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
  
  -- Получаем данные о последней отправке
  SELECT last_notification_sent_at, last_notification_hash
  INTO last_sent, stored_hash
  FROM public.orders
  WHERE id = p_order_id;
  
  -- Если уведомление никогда не отправлялось - кнопку не показываем
  IF last_sent IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Вычисляем текущий хеш
  current_hash := calculate_order_hash(p_order_id);
  
  -- Показываем кнопку только если данные изменились
  RETURN (stored_hash IS NULL OR current_hash != stored_hash);
END;
$$;

-- Создаем функцию для повторной отправки уведомления
CREATE OR REPLACE FUNCTION public.resend_order_notification(p_order_id uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_hash TEXT;
  order_record RECORD;
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
  
  -- Получаем данные заказа
  SELECT * INTO order_record
  FROM public.orders
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;
  
  -- Вычисляем новый хеш
  new_hash := calculate_order_hash(p_order_id);
  
  -- Обновляем метки времени и хеша
  UPDATE public.orders
  SET 
    last_notification_sent_at = NOW(),
    last_notification_hash = new_hash
  WHERE id = p_order_id;
  
  RETURN TRUE;
END;
$$;
