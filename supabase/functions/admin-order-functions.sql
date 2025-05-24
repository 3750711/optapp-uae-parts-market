
-- Updated admin order creation function with gap-filling order number logic
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
BEGIN
  -- Verify the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can use this function';
  END IF;

  -- Find the first missing order number in the sequence
  -- This query finds the smallest positive integer not in the order_number column
  WITH RECURSIVE number_series AS (
    SELECT 1 as num
    UNION ALL
    SELECT num + 1
    FROM number_series
    WHERE num < (SELECT COALESCE(MAX(order_number), 0) + 1 FROM public.orders)
  )
  SELECT COALESCE(
    (SELECT MIN(num) FROM number_series WHERE num NOT IN (SELECT order_number FROM public.orders)),
    (SELECT COALESCE(MAX(order_number), 0) + 1 FROM public.orders)
  ) INTO next_order_number;

  -- Insert the order with the calculated order number
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
