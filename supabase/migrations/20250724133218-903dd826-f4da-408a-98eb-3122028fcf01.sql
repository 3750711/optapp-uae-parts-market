-- Fix additional critical SECURITY DEFINER functions with search path
-- This completes the security hardening by fixing search paths in key functions

-- 6. Fix admin and seller functions
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
SET search_path = ''
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
    SELECT 1 FROM public.profiles 
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
  SELECT public.get_next_order_number() INTO next_order_number;

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
    p_images,
    p_product_id,
    p_delivery_method,
    p_text_order,
    p_delivery_price_confirm
  )
  RETURNING id INTO created_order_id;
  
  -- Если это заказ из товара, обновляем статус товара на 'sold'
  IF p_product_id IS NOT NULL THEN
    UPDATE public.products 
    SET status = 'sold'
    WHERE id = p_product_id;
  END IF;
  
  RETURN created_order_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- 7. Fix seller functions
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
  p_delivery_price_confirm numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  created_order_id UUID;
  next_order_number INTEGER;
  seller_opt_id_value TEXT;
BEGIN
  -- Проверяем, что текущий пользователь является продавцом
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'seller'
  ) THEN
    RAISE EXCEPTION 'Only sellers can use this function';
  END IF;

  -- Получаем opt_id продавца
  SELECT opt_id INTO seller_opt_id_value
  FROM public.profiles 
  WHERE id = auth.uid();

  -- Получаем следующий номер заказа (максимальный + 1)
  SELECT public.get_next_order_number() INTO next_order_number;

  -- Вставляем заказ с явно указанным номером
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
  
  RETURN created_order_id;
END;
$$;

-- 8. Fix other critical functions
CREATE OR REPLACE FUNCTION public.get_next_order_number()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Проверяем, что пользователь является администратором, продавцом или покупателем
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'seller', 'buyer')
  ) THEN
    RAISE EXCEPTION 'Only authenticated users can use this function';
  END IF;

  -- Блокируем таблицу для предотвращения конкурентного доступа
  LOCK TABLE public.orders IN ACCESS EXCLUSIVE MODE;
  
  -- Получаем максимальный номер заказа и добавляем 1
  SELECT COALESCE(MAX(order_number), 0) + 1 
  INTO next_number 
  FROM public.orders;
  
  RETURN next_number;
END;
$$;