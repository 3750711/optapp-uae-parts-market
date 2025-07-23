
-- Исправляем дублирование видео в заказах - финальная миграция
-- Обновляем функцию admin_create_order чтобы НЕ сохранять видео в video_url
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
  p_delivery_price_confirm numeric,
  p_videos text[] DEFAULT '{}'
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
  processed_videos TEXT[];
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
  RAISE LOG 'p_videos array length: %', COALESCE(array_length(p_videos, 1), 0);
  RAISE LOG 'p_delivery_price_confirm: %', p_delivery_price_confirm;
  RAISE LOG 'p_delivery_method: %', p_delivery_method;
  RAISE LOG 'p_product_id: %', p_product_id;

  -- Если указан product_id, проверяем и блокируем товар
  IF p_product_id IS NOT NULL THEN
    SELECT status INTO product_status
    FROM public.products 
    WHERE id = p_product_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product with ID % not found', p_product_id;
    END IF;
    
    IF product_status != 'active' THEN
      RAISE EXCEPTION 'Product is not available for order. Current status: %', product_status;
    END IF;
    
    IF EXISTS (
      SELECT 1 FROM public.orders 
      WHERE product_id = p_product_id 
      AND status NOT IN ('cancelled')
    ) THEN
      RAISE EXCEPTION 'An active order already exists for this product';
    END IF;
  END IF;

  -- Санитизация полей
  sanitized_brand := COALESCE(NULLIF(TRIM(p_brand), ''), '');
  sanitized_model := COALESCE(NULLIF(TRIM(p_model), ''), '');
  processed_images := COALESCE(p_images, ARRAY[]::text[]);
  processed_videos := COALESCE(p_videos, ARRAY[]::text[]);
  processed_delivery_price := p_delivery_price_confirm;

  -- Получаем следующий номер заказа
  SELECT get_next_order_number() INTO next_order_number;
  RAISE LOG 'Generated order number: %', next_order_number;

  -- Вставляем заказ БЕЗ поля video_url (не передаем его совсем)
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
    processed_images,
    p_product_id,
    p_delivery_method,
    p_text_order,
    processed_delivery_price
  )
  RETURNING id INTO created_order_id;
  
  RAISE LOG 'Order created successfully with ID: %', created_order_id;
  
  -- Сохраняем видео ТОЛЬКО в отдельную таблицу order_videos
  IF array_length(processed_videos, 1) > 0 THEN
    INSERT INTO public.order_videos (order_id, url)
    SELECT created_order_id, unnest(processed_videos);
    
    RAISE LOG 'Inserted % videos into order_videos table', array_length(processed_videos, 1);
  END IF;
  
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
    RAISE LOG 'Ошибка в admin_create_order: %', SQLERRM;
    RAISE;
END;
$$;

-- Обновляем функцию seller_create_order аналогично
CREATE OR REPLACE FUNCTION public.seller_create_order(
  p_title text, 
  p_price numeric, 
  p_place_number integer, 
  p_order_seller_name text, 
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
  p_delivery_price_confirm numeric,
  p_videos text[] DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  created_order_id UUID;
  next_order_number INTEGER;
  seller_opt_id_value TEXT;
  processed_videos TEXT[];
BEGIN
  -- Проверяем, что текущий пользователь является продавцом
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'seller'
  ) THEN
    RAISE EXCEPTION 'Only sellers can use this function';
  END IF;

  -- Логирование
  RAISE LOG 'seller_create_order called with videos: %', COALESCE(array_length(p_videos, 1), 0);

  -- Получаем opt_id продавца
  SELECT opt_id INTO seller_opt_id_value
  FROM profiles 
  WHERE id = auth.uid();

  -- Получаем следующий номер заказа
  SELECT get_next_order_number() INTO next_order_number;

  -- Обрабатываем видео
  processed_videos := COALESCE(p_videos, ARRAY[]::text[]);

  -- Вставляем заказ БЕЗ поля video_url
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
    next_order_number,
    p_title,
    p_price,
    p_place_number,
    auth.uid(),
    p_order_seller_name,
    seller_opt_id_value,
    p_buyer_id,
    p_brand,
    p_model,
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
  
  RAISE LOG 'Seller order created successfully with ID: %', created_order_id;
  
  -- Сохраняем видео ТОЛЬКО в отдельную таблицу order_videos
  IF array_length(processed_videos, 1) > 0 THEN
    INSERT INTO public.order_videos (order_id, url)
    SELECT created_order_id, unnest(processed_videos);
    
    RAISE LOG 'Inserted % videos into order_videos table', array_length(processed_videos, 1);
  END IF;
  
  RETURN created_order_id;
END;
$$;

-- Обновляем функцию create_user_order аналогично
CREATE OR REPLACE FUNCTION public.create_user_order(
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
  p_delivery_price_confirm numeric, 
  p_quantity integer DEFAULT 1, 
  p_description text DEFAULT NULL, 
  p_buyer_opt_id text DEFAULT NULL, 
  p_lot_number_order integer DEFAULT NULL, 
  p_telegram_url_buyer text DEFAULT NULL, 
  p_video_url text[] DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  created_order_id UUID;
  next_order_number INTEGER;
  current_user_type user_type;
  processed_videos TEXT[];
BEGIN
  -- Логируем начало создания заказа
  RAISE LOG 'Starting user order creation for user: %, videos: %', auth.uid(), COALESCE(array_length(p_video_url, 1), 0);
  
  -- Получаем тип текущего пользователя
  SELECT user_type INTO current_user_type
  FROM profiles 
  WHERE id = auth.uid();
  
  -- Проверяем права на создание заказа
  IF current_user_type = 'buyer' THEN
    IF p_buyer_id != auth.uid() THEN
      RAISE EXCEPTION 'Buyers can only create orders for themselves';
    END IF;
  ELSIF current_user_type = 'seller' THEN
    IF p_seller_id != auth.uid() THEN
      RAISE EXCEPTION 'Sellers can only create orders where they are the seller';
    END IF;
  ELSIF current_user_type = 'admin' THEN
    -- Администраторы могут создавать любые заказы
  ELSE
    RAISE EXCEPTION 'Invalid user type for order creation: %', current_user_type;
  END IF;

  -- Получаем следующий номер заказа
  SELECT get_next_order_number() INTO next_order_number;

  -- Обрабатываем видео
  processed_videos := COALESCE(p_video_url, ARRAY[]::text[]);

  -- Вставляем заказ БЕЗ поля video_url
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
    delivery_price_confirm,
    quantity,
    description,
    buyer_opt_id,
    lot_number_order,
    telegram_url_buyer
  ) VALUES (
    next_order_number,
    p_title,
    p_price,
    p_place_number,
    p_seller_id,
    p_order_seller_name,
    p_seller_opt_id,
    p_buyer_id,
    p_brand,
    p_model,
    p_status,
    p_order_created_type,
    p_telegram_url_order,
    p_images,
    p_product_id,
    p_delivery_method,
    p_text_order,
    p_delivery_price_confirm,
    p_quantity,
    p_description,
    p_buyer_opt_id,
    p_lot_number_order,
    p_telegram_url_buyer
  )
  RETURNING id INTO created_order_id;
  
  -- Сохраняем видео ТОЛЬКО в отдельную таблицу order_videos
  IF array_length(processed_videos, 1) > 0 THEN
    INSERT INTO public.order_videos (order_id, url)
    SELECT created_order_id, unnest(processed_videos);
    
    RAISE LOG 'Inserted % videos into order_videos table', array_length(processed_videos, 1);
  END IF;
  
  RAISE LOG 'User order created successfully with ID: %', created_order_id;
  
  RETURN created_order_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in create_user_order: %, SQLSTATE: %', SQLERRM, SQLSTATE;
    RAISE;
END;
$$;

-- Исправляем заказ №7548 - очищаем поле video_url
UPDATE public.orders 
SET video_url = '{}' 
WHERE order_number = 7548;

-- Исправляем все заказы с дублированными видео
UPDATE public.orders 
SET video_url = '{}' 
WHERE id IN (
  SELECT DISTINCT o.id 
  FROM orders o 
  JOIN order_videos ov ON o.id = ov.order_id 
  WHERE o.video_url IS NOT NULL AND array_length(o.video_url, 1) > 0
);

-- Логируем количество исправленных заказов
DO $$
DECLARE
  fixed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO fixed_count
  FROM orders o 
  JOIN order_videos ov ON o.id = ov.order_id 
  WHERE o.video_url = '{}';
  
  RAISE LOG 'Fixed video duplication in % orders', fixed_count;
END;
$$;
