
-- Updated admin order creation function with automatic sequence-based order numbering
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
BEGIN
  -- Verify the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can use this function';
  END IF;

  -- Insert the order without specifying order_number - let PostgreSQL sequence handle it
  INSERT INTO public.orders (
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
    p_delivery_price_confirm
  )
  RETURNING id INTO created_order_id;
  
  RETURN created_order_id;
END;
$$;

-- Function to check and sync order sequence if needed
CREATE OR REPLACE FUNCTION public.sync_order_sequence_if_needed()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  max_order_number INTEGER;
  current_sequence_value INTEGER;
BEGIN
  -- Получаем максимальный номер заказа
  SELECT COALESCE(MAX(order_number), 0) INTO max_order_number FROM orders;
  
  -- Получаем текущее значение последовательности
  SELECT last_value INTO current_sequence_value FROM orders_order_number_seq;
  
  -- Если последовательность отстает от максимального номера, синхронизируем её
  IF current_sequence_value <= max_order_number THEN
    PERFORM setval('orders_order_number_seq', max_order_number + 1, false);
  END IF;
END;
$$;
