
-- Updated admin order creation function with enhanced logging and error handling
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
  validated_seller_name TEXT;
BEGIN
  -- Verify the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can use this function';
  END IF;

  -- Log input parameters for debugging
  RAISE LOG 'admin_create_order called with seller_id: %, seller_name: "%"', p_seller_id, p_order_seller_name;

  -- Validate and ensure seller name is not null or empty
  validated_seller_name := COALESCE(TRIM(p_order_seller_name), '');
  
  IF validated_seller_name = '' THEN
    -- Try to get seller name from profiles if not provided or empty
    SELECT COALESCE(TRIM(full_name), 'Unknown Seller')
    INTO validated_seller_name
    FROM profiles
    WHERE id = p_seller_id;
    
    RAISE LOG 'Retrieved seller name from profiles: "%"', validated_seller_name;
  END IF;

  -- Final validation to ensure we have a seller name
  IF validated_seller_name IS NULL OR validated_seller_name = '' THEN
    validated_seller_name := 'Unknown Seller';
    RAISE LOG 'Using fallback seller name: "%"', validated_seller_name;
  END IF;

  -- Log the validated seller name
  RAISE LOG 'Final validated seller name: "%"', validated_seller_name;

  -- Получаем следующий номер заказа (максимальный + 1)
  SELECT get_next_order_number() INTO next_order_number;

  -- Log before insert
  RAISE LOG 'About to insert order with seller_name: "%"', validated_seller_name;

  -- Вставляем заказ с явно указанным номером и валидированным именем продавца
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
    validated_seller_name, -- Use validated seller name
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
    p_delivery_price_confirm
  )
  RETURNING id INTO created_order_id;
  
  -- Log successful creation
  RAISE LOG 'Order created successfully with id: %, seller_name: "%"', created_order_id, validated_seller_name;
  
  RETURN created_order_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error with context
    RAISE LOG 'Error in admin_create_order: %, seller_name was: "%"', SQLERRM, validated_seller_name;
    -- Re-raise the error
    RAISE;
END;
$$;

-- Function to get next order number (maximum + 1) - keeping existing logic
CREATE OR REPLACE FUNCTION public.get_next_order_number()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Проверяем, что пользователь является администратором или продавцом
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'seller')
  ) THEN
    RAISE EXCEPTION 'Only administrators and sellers can use this function';
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
