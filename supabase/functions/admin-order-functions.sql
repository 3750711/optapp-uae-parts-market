
-- Function to create orders as an administrator, bypassing RLS policies
CREATE OR REPLACE FUNCTION public.admin_create_order(
  p_title TEXT,
  p_price NUMERIC,
  p_place_number INTEGER,
  p_seller_id UUID,
  p_order_seller_name TEXT,
  p_seller_opt_id TEXT,
  p_buyer_id UUID,
  p_brand TEXT,
  p_model TEXT,
  p_status order_status,
  p_order_created_type order_created_type,
  p_telegram_url_order TEXT,
  p_images TEXT[],
  p_product_id UUID,
  p_delivery_method delivery_method,
  p_text_order TEXT,
  p_delivery_price_confirm NUMERIC
)
RETURNS UUID
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

  -- Insert the order
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
