-- Add validation for order status in admin_create_order function
CREATE OR REPLACE FUNCTION public.admin_create_order(
  p_title text,
  p_price numeric,
  p_description text DEFAULT NULL,
  p_seller_id uuid,
  p_order_seller_name text DEFAULT NULL,
  p_seller_opt_id text DEFAULT NULL,
  p_buyer_id uuid,
  p_brand text DEFAULT '',
  p_model text DEFAULT '',
  p_status order_status DEFAULT 'created',
  p_order_created_type order_created_type DEFAULT 'free_order',
  p_delivery_method delivery_method DEFAULT 'self_pickup',
  p_place_number integer DEFAULT 1,
  p_text_order text DEFAULT NULL,
  p_delivery_price_confirm numeric DEFAULT NULL,
  p_telegram_url_order text DEFAULT NULL,
  p_images text[] DEFAULT ARRAY[]::text[],
  p_videos text[] DEFAULT ARRAY[]::text[],
  p_product_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  order_id uuid;
  next_order_number integer;
  sanitized_brand text;
  sanitized_model text;
  processed_images text[];
  processed_delivery_price numeric;
BEGIN
  -- Проверяем что пользователь является администратором  
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can use this function';
  END IF;

  -- КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Валидация статуса заказа
  IF p_status NOT IN ('created', 'seller_confirmed', 'admin_confirmed', 'processed', 'shipped', 'delivered', 'cancelled') THEN
    RAISE LOG 'Invalid order status provided: %, defaulting to created', p_status;
    p_status := 'created';
  END IF;

  -- Логируем все параметры для отладки
  RAISE LOG 'admin_create_order called with: title=%, price=%, seller_id=%, buyer_id=%, status=%', 
    p_title, p_price, p_seller_id, p_buyer_id, p_status;
  
  -- Если указан product_id, блокируем товар
  IF p_product_id IS NOT NULL THEN
    RAISE LOG 'Updating product % status to sold', p_product_id;
    
    UPDATE public.products
    SET status = 'sold'
    WHERE id = p_product_id
    AND status != 'sold';
    
    IF NOT FOUND THEN
      RAISE LOG 'Product % not found or already sold', p_product_id;
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
    title,
    price,
    description,
    seller_id,
    order_seller_name,
    seller_opt_id, 
    buyer_id,
    brand,
    model,
    status,
    order_created_type,
    delivery_method,
    place_number,
    text_order,
    delivery_price_confirm,
    telegram_url_order,
    images,
    video_url,
    product_id,
    order_number
  ) VALUES (
    p_title,
    p_price,
    p_description,
    p_seller_id,
    COALESCE(p_order_seller_name, 'Unknown Seller'),
    p_seller_opt_id,
    p_buyer_id,
    sanitized_brand,
    sanitized_model,
    p_status,
    p_order_created_type,
    p_delivery_method,
    p_place_number,
    p_text_order,
    processed_delivery_price,
    p_telegram_url_order,
    processed_images,
    p_videos,
    p_product_id,
    next_order_number
  ) RETURNING id INTO order_id;

  RAISE LOG 'Created order with ID: % and order number: %', order_id, next_order_number;

  -- Уведомления участников о новом заказе
  BEGIN
    PERFORM create_bilingual_notification(
      p_buyer_id,
      'ORDER_CREATED',
      jsonb_build_object(
        'order_id', order_id,
        'order_number', next_order_number,
        'title', p_title,
        'price', p_price
      )
    );
    
    PERFORM create_bilingual_notification(
      p_seller_id,
      'NEW_ORDER',
      jsonb_build_object(
        'order_id', order_id,
        'order_number', next_order_number,
        'title', p_title,
        'price', p_price
      )
    );
    
    RAISE LOG 'Notifications sent for order %', order_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Failed to send notifications for order %: %', order_id, SQLERRM;
  END;

  RETURN order_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in admin_create_order: %', SQLERRM;
    RAISE;
END;
$function$;