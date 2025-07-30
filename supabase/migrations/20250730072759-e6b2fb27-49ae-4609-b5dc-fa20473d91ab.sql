-- Restore seller_create_order function with videos support
CREATE OR REPLACE FUNCTION public.seller_create_order(
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
AS $function$
DECLARE
  created_order_id UUID;
  next_order_number INTEGER;
  product_status product_status;
  sanitized_brand TEXT;
  sanitized_model TEXT;
  video_url TEXT;
BEGIN
  -- Verify the current user is the seller or an admin
  IF NOT (p_seller_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )) THEN
    RAISE EXCEPTION 'Only the seller or admin can create orders for this seller';
  END IF;

  -- If product_id is provided, check and lock the product
  IF p_product_id IS NOT NULL THEN
    -- Lock the product row to prevent concurrent access
    SELECT status INTO product_status
    FROM public.products 
    WHERE id = p_product_id
    FOR UPDATE;
    
    -- Check if product exists
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product with ID % not found', p_product_id;
    END IF;
    
    -- Check if product is available
    IF product_status != 'active' THEN
      RAISE EXCEPTION 'Product is not available for order. Current status: %', product_status;
    END IF;
    
    -- Check if there are no existing active orders for this product
    IF EXISTS (
      SELECT 1 FROM public.orders 
      WHERE product_id = p_product_id 
      AND status NOT IN ('cancelled')
    ) THEN
      RAISE EXCEPTION 'An active order already exists for this product';
    END IF;
  END IF;

  -- Sanitize brand and model fields: convert null to empty strings
  sanitized_brand := COALESCE(NULLIF(TRIM(p_brand), ''), '');
  sanitized_model := COALESCE(NULLIF(TRIM(p_model), ''), '');

  -- Get next order number
  RAISE LOG 'Getting next order number for seller order creation...';
  SELECT get_next_order_number() INTO next_order_number;
  RAISE LOG 'Seller order will use number: %', next_order_number;

  -- Insert the order
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
    video_url
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
    p_delivery_price_confirm,
    p_videos
  )
  RETURNING id INTO created_order_id;
  
  RAISE LOG 'Seller order created successfully with ID: % and number: %', created_order_id, next_order_number;
  
  -- Insert videos into order_videos table
  IF p_videos IS NOT NULL AND array_length(p_videos, 1) > 0 THEN
    FOR i IN 1..array_length(p_videos, 1) LOOP
      video_url := p_videos[i];
      IF video_url IS NOT NULL AND TRIM(video_url) != '' THEN
        INSERT INTO public.order_videos (order_id, url)
        VALUES (created_order_id, video_url);
        RAISE LOG 'Inserted video for order %: %', created_order_id, video_url;
      END IF;
    END LOOP;
  END IF;
  
  -- If this is a product order, update product status to 'sold'
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
    RAISE LOG 'Error in seller_create_order: %', SQLERRM;
    -- Re-raise the error
    RAISE;
END;
$function$;