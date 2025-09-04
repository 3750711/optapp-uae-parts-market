-- Fix enum casting in admin_create_free_order function
CREATE OR REPLACE FUNCTION public.admin_create_free_order(
  p_title text,
  p_price numeric,
  p_seller_id uuid,
  p_buyer_opt_id text,
  p_brand text DEFAULT '',
  p_model text DEFAULT '',
  p_description text DEFAULT '',
  p_images text[] DEFAULT '{}',
  p_video_url text[] DEFAULT '{}',
  p_delivery_method delivery_method DEFAULT 'self_pickup',
  p_place_number integer DEFAULT 1,
  p_delivery_price_confirm numeric DEFAULT NULL,
  p_text_order text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_order_number integer;
  v_buyer_id uuid;
  v_seller_name text;
  v_seller_opt_id text;
BEGIN
  RAISE LOG 'admin_create_free_order called with: title=%, price=%, seller_id=%, buyer_opt_id=%', 
    p_title, p_price, p_seller_id, p_buyer_opt_id;

  -- Only proceed if user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can use this function';
  END IF;

  -- Find buyer by OPT_ID
  SELECT id INTO v_buyer_id
  FROM public.profiles
  WHERE opt_id = p_buyer_opt_id
  AND user_type = 'buyer';

  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'Buyer with OPT_ID % not found', p_buyer_opt_id;
  END IF;

  RAISE LOG 'Found buyer with ID: %', v_buyer_id;

  -- Get seller information
  SELECT full_name, opt_id INTO v_seller_name, v_seller_opt_id
  FROM public.profiles
  WHERE id = p_seller_id;

  IF v_seller_name IS NULL THEN
    v_seller_name := 'Unknown Seller';
  END IF;

  RAISE LOG 'Seller info: name=%, opt_id=%', v_seller_name, v_seller_opt_id;

  -- Generate next order number
  SELECT get_next_order_number() INTO v_order_number;
  RAISE LOG 'Generated order number: %', v_order_number;

  -- Insert the free order with admin_confirmed status
  INSERT INTO public.orders (
    id,
    order_number,
    title,
    price,
    seller_id,
    buyer_id,
    status,
    quantity,
    delivery_method,
    place_number,
    delivery_price_confirm,
    product_id,
    brand,
    model,
    description,
    images,
    video_url,
    text_order,
    order_created_type,
    order_seller_name,
    seller_opt_id,
    buyer_opt_id,
    created_at
  ) VALUES (
    gen_random_uuid(),
    v_order_number,
    p_title,
    p_price,
    p_seller_id,
    v_buyer_id,
    'admin_confirmed'::order_status,  -- FIXED: Added proper enum casting
    1,  -- Default quantity for free orders
    p_delivery_method,
    p_place_number,
    p_delivery_price_confirm,
    NULL,  -- No product_id for free orders
    p_brand,
    p_model,
    p_description,
    p_images,
    p_video_url,
    p_text_order,
    'free_order'::order_created_type,  -- FIXED: Added proper enum casting
    v_seller_name,
    v_seller_opt_id,
    p_buyer_opt_id,
    now()
  )
  RETURNING id INTO v_order_id;

  RAISE LOG 'Free order created successfully with ID: %', v_order_id;

  RETURN v_order_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in admin_create_free_order: %', SQLERRM;
    RAISE;
END;
$$;