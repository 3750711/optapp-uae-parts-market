
-- Updated admin order creation function with enhanced logging and fixed parameter handling
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
  processed_images TEXT[];
  processed_delivery_price NUMERIC;
BEGIN
  -- Verify the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can use this function';
  END IF;

  -- ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ ВХОДЯЩИХ ПАРАМЕТРОВ
  RAISE LOG 'admin_create_order called with parameters:';
  RAISE LOG 'p_title: %', p_title;
  RAISE LOG 'p_price: %', p_price;
  RAISE LOG 'p_images array length: %', COALESCE(array_length(p_images, 1), 0);
  RAISE LOG 'p_images content: %', p_images;
  RAISE LOG 'p_delivery_price_confirm: %', p_delivery_price_confirm;
  
  -- Детальное логирование изображений
  IF p_images IS NOT NULL AND array_length(p_images, 1) > 0 THEN
    FOR i IN 1..array_length(p_images, 1) LOOP
      RAISE LOG 'admin_create_order image[%]: %', i, p_images[i];
      IF p_images[i] IS NULL OR TRIM(p_images[i]) = '' THEN
        RAISE LOG 'admin_create_order WARNING: Empty or null image at index %', i;
      END IF;
    END LOOP;
  ELSE
    RAISE LOG 'admin_create_order: No images provided';
  END IF;
  RAISE LOG 'p_delivery_method: %', p_delivery_method;
  RAISE LOG 'p_product_id: %', p_product_id;

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

  -- ОБРАБОТКА ИЗОБРАЖЕНИЙ: убеждаемся что массив не null
  processed_images := COALESCE(p_images, ARRAY[]::text[]);
  RAISE LOG 'Processed images array: %', processed_images;
  RAISE LOG 'Processed images array length: %', array_length(processed_images, 1);

  -- ОБРАБОТКА СТОИМОСТИ ДОСТАВКИ: правильно обрабатываем null значения
  processed_delivery_price := p_delivery_price_confirm;
  RAISE LOG 'Processed delivery price: %', processed_delivery_price;

  -- Получаем следующий номер заказа (максимальный + 1)
  SELECT get_next_order_number() INTO next_order_number;
  RAISE LOG 'Generated order number: %', next_order_number;

  -- Вставляем заказ - КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: явно передаем обработанные значения
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
    images,               -- ИСПРАВЛЕНО: используем processed_images
    product_id,
    delivery_method,
    text_order,
    delivery_price_confirm  -- ИСПРАВЛЕНО: используем processed_delivery_price
  ) VALUES (
    next_order_number,
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
    processed_images,           -- ИСПРАВЛЕНО: передаем обработанный массив изображений
    p_product_id,
    p_delivery_method,
    p_text_order,
    processed_delivery_price    -- ИСПРАВЛЕНО: передаем обработанную стоимость доставки
  )
  RETURNING id INTO created_order_id;
  
  RAISE LOG 'Order created successfully with ID: %', created_order_id;
  
  -- Проверяем что данные действительно сохранились
  DECLARE
    saved_images_count INTEGER;
    saved_delivery_price NUMERIC;
  BEGIN
    SELECT 
      array_length(images, 1), 
      delivery_price_confirm 
    INTO 
      saved_images_count, 
      saved_delivery_price
    FROM public.orders 
    WHERE id = created_order_id;
    
    RAISE LOG 'Verification - saved images count: %', COALESCE(saved_images_count, 0);
    RAISE LOG 'Verification - saved delivery price: %', saved_delivery_price;
  END;
  
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
    RAISE LOG 'Error context - p_images: %, p_delivery_price_confirm: %', p_images, p_delivery_price_confirm;
    -- Re-raise the error
    RAISE;
END;
$$;

-- Function to get next order number (maximum + 1)
CREATE OR REPLACE FUNCTION public.get_next_order_number()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  RAISE LOG 'get_next_order_number: Starting order number generation with table locking';
  
  -- Lock the entire orders table to prevent race conditions
  -- SHARE ROW EXCLUSIVE allows SELECT but blocks INSERT/UPDATE from other transactions
  LOCK TABLE public.orders IN SHARE ROW EXCLUSIVE MODE;
  
  -- Use MAX+1 logic to handle gaps and manual changes
  SELECT COALESCE(MAX(order_number), 0) + 1 
  INTO next_number 
  FROM public.orders;
  
  RAISE LOG 'get_next_order_number: Generated order number % with table locking', next_number;
  
  RETURN next_number;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in get_next_order_number: %', SQLERRM;
    RAISE;
END;
$$;
