-- Fix admin_create_order function to properly handle order_created_type enum
CREATE OR REPLACE FUNCTION public.admin_create_order(
  p_title text,
  p_price numeric,
  p_seller_id uuid,
  p_buyer_id uuid,
  p_status order_status DEFAULT 'created',
  p_quantity integer DEFAULT 1,
  p_delivery_method delivery_method DEFAULT 'self_pickup',
  p_place_number integer DEFAULT 1,
  p_delivery_price_confirm numeric DEFAULT NULL,
  p_product_id uuid DEFAULT NULL,
  p_brand text DEFAULT '',
  p_model text DEFAULT '',
  p_description text DEFAULT '',
  p_images text[] DEFAULT '{}',
  p_video_url text[] DEFAULT '{}',
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
  v_created_type order_created_type;
BEGIN
  RAISE LOG 'admin_create_order called with: title=%, price=%, seller_id=%, buyer_id=%, status=%', 
    p_title, p_price, p_seller_id, p_buyer_id, p_status;

  -- Only proceed if user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can use this function';
  END IF;

  -- Determine order_created_type based on product_id
  IF p_product_id IS NOT NULL THEN
    v_created_type := 'product_order'::order_created_type;
  ELSE
    v_created_type := 'free_order'::order_created_type;
  END IF;

  RAISE LOG 'Determined order_created_type: %', v_created_type;

  -- Generate next order number
  SELECT get_next_order_number() INTO v_order_number;
  RAISE LOG 'Generated order number: %', v_order_number;

  -- Update product status to sold if product_id is provided
  IF p_product_id IS NOT NULL THEN
    RAISE LOG 'Updating product % status to sold', p_product_id;
    UPDATE public.products
    SET status = 'sold'
    WHERE id = p_product_id;
  END IF;

  -- Process images array
  RAISE LOG 'Processed images array: %', p_images;

  -- Process delivery price  
  RAISE LOG 'Processed delivery price: %', p_delivery_price_confirm;

  -- Insert the order
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
    created_at
  ) VALUES (
    gen_random_uuid(),
    v_order_number,
    p_title,
    p_price,
    p_seller_id,
    p_buyer_id,
    p_status,
    p_quantity,
    p_delivery_method,
    p_place_number,
    p_delivery_price_confirm,
    p_product_id,
    p_brand,
    p_model,
    p_description,
    p_images,
    p_video_url,
    p_text_order,
    v_created_type,  -- Use the properly cast enum value
    now()
  )
  RETURNING id INTO v_order_id;

  RAISE LOG 'Order created successfully with ID: %', v_order_id;

  RETURN v_order_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in admin_create_order: %', SQLERRM;
    RAISE;
END;
$$;