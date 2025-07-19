
-- Удаляем проблемный заказ с дублирующим номером 6988
DELETE FROM public.orders 
WHERE id = '0eed6d9a-81f3-4dee-be3d-1620ea139fb1';

-- Удаляем связанные уведомления для этого заказа
DELETE FROM public.notifications 
WHERE data->>'order_id' = '0eed6d9a-81f3-4dee-be3d-1620ea139fb1';

-- Убираем DEFAULT значение из поля order_number
ALTER TABLE public.orders 
ALTER COLUMN order_number DROP DEFAULT;

-- Устанавливаем DEFAULT NULL для order_number (номер будет задаваться только через функции)
ALTER TABLE public.orders 
ALTER COLUMN order_number SET DEFAULT NULL;

-- Обновляем sequence до правильного значения (на всякий случай)
SELECT setval('orders_order_number_seq', COALESCE(MAX(order_number), 0) + 1, false) 
FROM public.orders;

-- Добавляем UNIQUE constraint на order_number для предотвращения дублирования
ALTER TABLE public.orders 
ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);

-- Обновляем функцию admin_create_order для гарантии использования get_next_order_number()
CREATE OR REPLACE FUNCTION public.admin_create_order(
  p_title text, 
  p_price numeric, 
  p_place_number integer, 
  p_seller_id uuid, 
  p_order_seller_name text, 
  p_seller_opt_id text, 
  p_buyer_id uuid, 
  p_brand text, 
  p_model text, 
  p_status order_status, 
  p_order_created_type order_created_type, 
  p_telegram_url_order text, 
  p_images text[], 
  p_product_id uuid, 
  p_delivery_method delivery_method, 
  p_text_order text, 
  p_delivery_price_confirm numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  created_order_id UUID;
  next_order_number INTEGER;
  product_status product_status;
  sanitized_brand TEXT;
  sanitized_model TEXT;
BEGIN
  -- Verify the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can use this function';
  END IF;

  -- Если указан product_id, проверяем и блокируем товар
  IF p_product_id IS NOT NULL THEN
    -- Блокируем строку товара для предотвращения одновременного доступа
    SELECT status INTO product_status
    FROM public.products 
    WHERE id = p_product_id
    FOR UPDATE;
    
    -- Проверяем, что товар найден
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product with ID % not found', p_product_id;
    END IF;
    
    -- Проверяем, что товар имеет статус 'active'
    IF product_status != 'active' THEN
      RAISE EXCEPTION 'Product is not available for order. Current status: %', product_status;
    END IF;
    
    -- Проверяем, что для этого товара еще нет активных заказов
    IF EXISTS (
      SELECT 1 FROM public.orders 
      WHERE product_id = p_product_id 
      AND status NOT IN ('cancelled')
    ) THEN
      RAISE EXCEPTION 'An active order already exists for this product';
    END IF;
  END IF;

  -- Санитизация полей brand и model: конвертируем null в пустые строки
  sanitized_brand := COALESCE(NULLIF(TRIM(p_brand), ''), '');
  sanitized_model := COALESCE(NULLIF(TRIM(p_model), ''), '');

  -- ОБЯЗАТЕЛЬНО используем get_next_order_number() для получения номера
  RAISE LOG 'Getting next order number for admin order creation...';
  SELECT get_next_order_number() INTO next_order_number;
  RAISE LOG 'Admin order will use number: %', next_order_number;

  -- Вставляем заказ с номером от get_next_order_number()
  INSERT INTO public.orders (
    order_number,
    title,
    price,
    place_number,
    seller_id,
    order_seller_name,
    seller_opt_id,
    buyer_id,
    brand,
    model,
    status,
    order_created_type,
    telegram_url_order,
    images,
    product_id,
    delivery_method,
    text_order,
    delivery_price_confirm
  ) VALUES (
    next_order_number, -- Используем номер от функции
    p_title,
    p_price,
    p_place_number,
    p_seller_id,
    p_order_seller_name,
    p_seller_opt_id,
    p_buyer_id,
    sanitized_brand,
    sanitized_model,
    p_status,
    p_order_created_type,
    p_telegram_url_order,
    p_images,
    p_product_id,
    p_delivery_method,
    p_text_order,
    p_delivery_price_confirm
  )
  RETURNING id INTO created_order_id;
  
  RAISE LOG 'Admin order created successfully with ID: % and number: %', created_order_id, next_order_number;
  
  -- Если это заказ из товара, обновляем статус товара на 'sold'
  IF p_product_id IS NOT NULL THEN
    UPDATE public.products 
    SET status = 'sold'
    WHERE id = p_product_id;
    RAISE LOG 'Product % status updated to sold', p_product_id;
  END IF;
  
  RETURN created_order_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error with context
    RAISE LOG 'Ошибка в admin_create_order: %', SQLERRM;
    -- Re-raise the error
    RAISE;
END;
$$;
