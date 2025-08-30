-- Create function to get next order number (maximum + 1)
CREATE OR REPLACE FUNCTION public.get_next_order_number()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Check that user is authenticated
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'seller', 'buyer')
  ) THEN
    RAISE EXCEPTION 'Only authenticated users can use this function';
  END IF;

  -- Lock table to prevent concurrent access
  LOCK TABLE public.orders IN ACCESS EXCLUSIVE MODE;
  
  -- Get maximum order number and add 1
  SELECT COALESCE(MAX(order_number), 0) + 1 
  INTO next_number 
  FROM public.orders;
  
  RETURN next_number;
END;
$$;

-- Recreate admin_create_order function with proper error handling
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

  -- Log incoming parameters
  RAISE LOG 'admin_create_order called with parameters:';
  RAISE LOG 'p_title: %', p_title;
  RAISE LOG 'p_price: %', p_price;
  RAISE LOG 'p_images array length: %', COALESCE(array_length(p_images, 1), 0);
  RAISE LOG 'p_delivery_price_confirm: %', p_delivery_price_confirm;
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
      RAISE EXCEPTION 'Product with ID % not found', p_product_id;
    END IF;
    
    -- Check that product has status 'active'
    IF product_status != 'active' THEN
      RAISE EXCEPTION 'Product is not available for order. Current status: %', product_status;
    END IF;
    
    -- Check that there are no active orders for this product
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

  -- Process images: ensure array is not null
  processed_images := COALESCE(p_images, ARRAY[]::text[]);
  RAISE LOG 'Processed images array: %', processed_images;

  -- Process delivery price: properly handle null values
  processed_delivery_price := p_delivery_price_confirm;
  RAISE LOG 'Processed delivery price: %', processed_delivery_price;

  -- Get next order number (maximum + 1)
  SELECT get_next_order_number() INTO next_order_number;
  RAISE LOG 'Generated order number: %', next_order_number;

  -- Insert order with processed values
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
    -- Log the error with context
    RAISE LOG 'Error in admin_create_order: %', SQLERRM;
    RAISE LOG 'Error context - p_images: %, p_delivery_price_confirm: %', p_images, p_delivery_price_confirm;
    -- Re-raise the error
    RAISE;
END;
$$;