-- Add index for fast MAX(order_number) lookups
CREATE INDEX IF NOT EXISTS orders_order_number_desc_idx 
ON public.orders (order_number DESC);

-- Rewrite admin_create_order with atomic advisory lock approach
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
  product_status product_status;
  sanitized_brand TEXT;
  sanitized_model TEXT;
  processed_images TEXT[];
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

  -- Set lock timeout to prevent hanging
  SET LOCAL lock_timeout = '2s';

  -- Use advisory lock for atomic order number generation
  PERFORM pg_advisory_lock(42);

  -- DETAILED LOGGING OF INCOMING PARAMETERS
  RAISE LOG 'admin_create_order called with parameters:';
  RAISE LOG 'p_title: %', p_title;
  RAISE LOG 'p_price: %', p_price;
  RAISE LOG 'p_images array length: %', COALESCE(array_length(p_images, 1), 0);
  RAISE LOG 'p_images content: %', p_images;
  RAISE LOG 'p_delivery_price_confirm: %', p_delivery_price_confirm;
  
  -- Detailed image logging
  IF p_images IS NOT NULL AND array_length(p_images, 1) > 0 THEN
    FOR i IN 1..array_length(p_images, 1) LOOP
      RAISE LOG 'admin_create_order image[%]: %', i, p_images[i];
      IF p_images[i] IS NULL OR TRIM(p_images[i]) = '' THEN
        RAISE LOG 'admin_create_order WARNING: Empty or null image at index %', i;
      END IF;
    END LOOP;
  ELSE
    RAISE LOG 'admin_create_order: No images provided';
  END IF;
  RAISE LOG 'p_delivery_method: %', p_delivery_method;
  RAISE LOG 'p_product_id: %', p_product_id;

  -- If product_id is specified, check and lock the product
  IF p_product_id IS NOT NULL THEN
    -- Lock product row to prevent concurrent access
    SELECT status INTO product_status
    FROM public.products 
    WHERE id = p_product_id
    FOR UPDATE;
    
    -- Check that product was found
    IF NOT FOUND THEN
      PERFORM pg_advisory_unlock(42);
      RAISE EXCEPTION 'Product with ID % not found', p_product_id;
    END IF;
    
    -- Check that product has status 'active'
    IF product_status != 'active' THEN
      PERFORM pg_advisory_unlock(42);
      RAISE EXCEPTION 'Product is not available for order. Current status: %', product_status;
    END IF;
    
    -- Check that no active orders exist for this product
    IF EXISTS (
      SELECT 1 FROM public.orders 
      WHERE product_id = p_product_id 
      AND status NOT IN ('cancelled')
    ) THEN
      PERFORM pg_advisory_unlock(42);
      RAISE EXCEPTION 'An active order already exists for this product';
    END IF;
  END IF;

  -- Sanitize brand and model fields: convert null to empty strings
  sanitized_brand := COALESCE(NULLIF(TRIM(p_brand), ''), '');
  sanitized_model := COALESCE(NULLIF(TRIM(p_model), ''), '');

  -- PROCESS IMAGES: ensure array is not null
  processed_images := COALESCE(p_images, ARRAY[]::text[]);
  RAISE LOG 'Processed images array: %', processed_images;
  RAISE LOG 'Processed images array length: %', array_length(processed_images, 1);

  -- PROCESS DELIVERY PRICE: properly handle null values
  processed_delivery_price := p_delivery_price_confirm;
  RAISE LOG 'Processed delivery price: %', processed_delivery_price;

  -- Get next order number atomically (MAX + 1)
  SELECT COALESCE(MAX(order_number), 0) + 1 
  INTO next_order_number
  FROM public.orders;
  
  RAISE LOG 'Generated order number: %', next_order_number;

  -- Insert order - CRITICAL FIX: explicitly pass processed values
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
  
  -- Release advisory lock
  PERFORM pg_advisory_unlock(42);
  
  RAISE LOG 'Order created successfully with ID: %', created_order_id;
  
  -- Verify that data was actually saved
  DECLARE
    saved_images_count INTEGER;
    saved_delivery_price NUMERIC;
  BEGIN
    SELECT 
      array_length(images, 1), 
      delivery_price_confirm 
    INTO 
      saved_images_count, 
      saved_delivery_price
    FROM public.orders 
    WHERE id = created_order_id;
    
    RAISE LOG 'Verification - saved images count: %', COALESCE(saved_images_count, 0);
    RAISE LOG 'Verification - saved delivery price: %', saved_delivery_price;
  END;
  
  -- If this is an order from a product, update product status to 'sold'
  IF p_product_id IS NOT NULL THEN
    UPDATE public.products 
    SET status = 'sold'
    WHERE id = p_product_id;
    RAISE LOG 'Product % status updated to sold', p_product_id;
  END IF;
  
  RETURN created_order_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Ensure advisory lock is released on error
    PERFORM pg_advisory_unlock(42);
    -- Log the error with context
    RAISE LOG 'Error in admin_create_order: %', SQLERRM;
    RAISE LOG 'Error context - p_images: %, p_delivery_price_confirm: %', p_images, p_delivery_price_confirm;
    -- Re-raise the error
    RAISE;
END;
$$;

-- Rewrite seller_create_order with atomic advisory lock approach
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
  p_videos text[] DEFAULT '{}'::text[]
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
  image_url TEXT;
  video_url TEXT;
BEGIN
  -- Verify the user is a seller or admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (user_type = 'seller' OR user_type = 'admin')
  ) THEN
    RAISE EXCEPTION 'Only sellers and admins can create orders';
  END IF;

  -- Set lock timeout to prevent hanging
  SET LOCAL lock_timeout = '2s';

  -- Use advisory lock for atomic order number generation
  PERFORM pg_advisory_lock(42);

  -- Log incoming parameters
  RAISE LOG 'seller_create_order called with: title=%, price=%, videos_count=%', 
    p_title, p_price, COALESCE(array_length(p_videos, 1), 0);

  -- If product_id is provided, lock and check the product
  IF p_product_id IS NOT NULL THEN
    SELECT status INTO product_status
    FROM public.products 
    WHERE id = p_product_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
      PERFORM pg_advisory_unlock(42);
      RAISE EXCEPTION 'Product with ID % not found', p_product_id;
    END IF;
    
    IF product_status != 'active' THEN
      PERFORM pg_advisory_unlock(42);
      RAISE EXCEPTION 'Product is not available for order. Current status: %', product_status;
    END IF;
    
    IF EXISTS (
      SELECT 1 FROM public.orders 
      WHERE product_id = p_product_id 
      AND status NOT IN ('cancelled')
    ) THEN
      PERFORM pg_advisory_unlock(42);
      RAISE EXCEPTION 'An active order already exists for this product';
    END IF;
  END IF;

  -- Sanitize brand and model fields
  sanitized_brand := COALESCE(NULLIF(TRIM(p_brand), ''), '');
  sanitized_model := COALESCE(NULLIF(TRIM(p_model), ''), '');

  -- Get next order number atomically (MAX + 1)
  SELECT COALESCE(MAX(order_number), 0) + 1 
  INTO next_order_number
  FROM public.orders;
  
  RAISE LOG 'Seller order will use number: %', next_order_number;

  -- Create the order
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
    COALESCE(p_images, '{}'),
    p_product_id,
    p_delivery_method,
    p_text_order,
    p_delivery_price_confirm
  )
  RETURNING id INTO created_order_id;
  
  -- Release advisory lock
  PERFORM pg_advisory_unlock(42);
  
  RAISE LOG 'Order created successfully with ID: % and number: %', created_order_id, next_order_number;
  
  -- Insert order images from the images array
  IF p_images IS NOT NULL AND array_length(p_images, 1) > 0 THEN
    FOR i IN 1..array_length(p_images, 1) LOOP
      image_url := p_images[i];
      IF image_url IS NOT NULL AND TRIM(image_url) != '' THEN
        INSERT INTO public.order_images (order_id, url, is_primary)
        VALUES (created_order_id, image_url, i = 1);
        RAISE LOG 'Inserted order image: % (primary: %)', image_url, i = 1;
      END IF;
    END LOOP;
  END IF;
  
  -- Insert order videos from the videos array  
  IF p_videos IS NOT NULL AND array_length(p_videos, 1) > 0 THEN
    FOR i IN 1..array_length(p_videos, 1) LOOP
      video_url := p_videos[i];
      IF video_url IS NOT NULL AND TRIM(video_url) != '' THEN
        INSERT INTO public.order_videos (order_id, url)
        VALUES (created_order_id, video_url);
        RAISE LOG 'Inserted order video: %', video_url;
      END IF;
    END LOOP;
  END IF;
  
  -- Update product status to 'sold' if product_id is provided
  IF p_product_id IS NOT NULL THEN
    UPDATE public.products 
    SET status = 'sold'
    WHERE id = p_product_id;
    RAISE LOG 'Product % status updated to sold', p_product_id;
  END IF;
  
  RETURN created_order_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Ensure advisory lock is released on error
    PERFORM pg_advisory_unlock(42);
    RAISE LOG 'Error in seller_create_order: %', SQLERRM;
    RAISE;
END;
$$;

-- Remove the old get_next_order_number function as it's no longer needed
DROP FUNCTION IF EXISTS public.get_next_order_number();