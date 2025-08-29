-- Create admin_create_order_v2 with atomic advisory lock logic
CREATE OR REPLACE FUNCTION public.admin_create_order_v2(
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

  -- ATOMIC ADVISORY LOCK APPROACH: Generate order number with advisory lock
  -- Use advisory lock to prevent race conditions
  IF NOT pg_try_advisory_xact_lock(12346) THEN
    RAISE EXCEPTION 'Could not acquire lock for order number generation';
  END IF;

  -- Get next order number atomically within the lock
  SELECT COALESCE(MAX(order_number), 0) + 1 
  INTO next_order_number 
  FROM public.orders;

  RAISE LOG 'admin_create_order_v2: Generated order number % with advisory lock', next_order_number;

  -- Process inputs
  sanitized_brand := COALESCE(NULLIF(TRIM(p_brand), ''), '');
  sanitized_model := COALESCE(NULLIF(TRIM(p_model), ''), '');
  processed_images := COALESCE(p_images, ARRAY[]::text[]);
  processed_delivery_price := p_delivery_price_confirm;

  -- If product_id is specified, validate and lock product
  IF p_product_id IS NOT NULL THEN
    SELECT status INTO product_status
    FROM public.products 
    WHERE id = p_product_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product with ID % not found', p_product_id;
    END IF;
    
    IF product_status != 'active' THEN
      RAISE EXCEPTION 'Product is not available for order. Current status: %', product_status;
    END IF;
    
    IF EXISTS (
      SELECT 1 FROM public.orders 
      WHERE product_id = p_product_id 
      AND status NOT IN ('cancelled')
    ) THEN
      RAISE EXCEPTION 'An active order already exists for this product';
    END IF;
  END IF;

  -- Insert order with generated order number
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
  
  RAISE LOG 'admin_create_order_v2: Order created successfully with ID: %', created_order_id;
  
  -- If this is an order from a product, update product status to 'sold'
  IF p_product_id IS NOT NULL THEN
    UPDATE public.products 
    SET status = 'sold'
    WHERE id = p_product_id;
    RAISE LOG 'admin_create_order_v2: Product % status updated to sold', p_product_id;
  END IF;
  
  -- Advisory lock is automatically released at transaction end
  RETURN created_order_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in admin_create_order_v2: %', SQLERRM;
    RAISE;
END;
$$;

-- Create seller_create_order_v2 with atomic advisory lock logic
CREATE OR REPLACE FUNCTION public.seller_create_order_v2(
  p_title text,
  p_price numeric,
  p_place_number integer,
  p_buyer_opt_id text,
  p_brand text,
  p_model text,
  p_delivery_method delivery_method,
  p_text_order text,
  p_telegram_url_order text,
  p_images text[] DEFAULT ARRAY[]::text[],
  p_product_id uuid DEFAULT NULL,
  p_delivery_price_confirm numeric DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  created_order_id UUID;
  next_order_number INTEGER;
  buyer_id_found UUID;
  current_seller_id UUID;
  current_seller_name TEXT;
  current_seller_opt_id TEXT;
  product_status product_status;
  sanitized_brand TEXT;
  sanitized_model TEXT;
  processed_images TEXT[];
  processed_delivery_price NUMERIC;
BEGIN
  -- Get current user ID (seller)
  current_seller_id := auth.uid();
  IF current_seller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Verify user is a seller
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = current_seller_id 
    AND user_type = 'seller'
  ) THEN
    RAISE EXCEPTION 'Only sellers can use this function';
  END IF;

  -- Get seller information
  SELECT full_name, opt_id
  INTO current_seller_name, current_seller_opt_id
  FROM profiles
  WHERE id = current_seller_id;

  -- Find buyer by opt_id
  SELECT id INTO buyer_id_found
  FROM profiles
  WHERE opt_id = p_buyer_opt_id
  AND user_type = 'buyer';

  IF buyer_id_found IS NULL THEN
    RAISE EXCEPTION 'Buyer with OPT ID % not found', p_buyer_opt_id;
  END IF;

  -- ATOMIC ADVISORY LOCK APPROACH: Generate order number with advisory lock
  IF NOT pg_try_advisory_xact_lock(12347) THEN
    RAISE EXCEPTION 'Could not acquire lock for order number generation';
  END IF;

  -- Get next order number atomically within the lock
  SELECT COALESCE(MAX(order_number), 0) + 1 
  INTO next_order_number 
  FROM public.orders;

  RAISE LOG 'seller_create_order_v2: Generated order number % with advisory lock', next_order_number;

  -- Process inputs
  sanitized_brand := COALESCE(NULLIF(TRIM(p_brand), ''), '');
  sanitized_model := COALESCE(NULLIF(TRIM(p_model), ''), '');
  processed_images := COALESCE(p_images, ARRAY[]::text[]);
  processed_delivery_price := p_delivery_price_confirm;

  -- If product_id is specified, validate and lock product
  IF p_product_id IS NOT NULL THEN
    SELECT status INTO product_status
    FROM public.products 
    WHERE id = p_product_id
    AND seller_id = current_seller_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product with ID % not found or not owned by seller', p_product_id;
    END IF;
    
    IF product_status != 'active' THEN
      RAISE EXCEPTION 'Product is not available for order. Current status: %', product_status;
    END IF;
    
    IF EXISTS (
      SELECT 1 FROM public.orders 
      WHERE product_id = p_product_id 
      AND status NOT IN ('cancelled')
    ) THEN
      RAISE EXCEPTION 'An active order already exists for this product';
    END IF;
  END IF;

  -- Insert order
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
    current_seller_id,
    current_seller_name,
    current_seller_opt_id,
    buyer_id_found,
    sanitized_brand,
    sanitized_model,
    'created',
    CASE WHEN p_product_id IS NOT NULL THEN 'from_product' ELSE 'free_order' END,
    p_telegram_url_order,
    processed_images,
    p_product_id,
    p_delivery_method,
    p_text_order,
    processed_delivery_price
  )
  RETURNING id INTO created_order_id;
  
  RAISE LOG 'seller_create_order_v2: Order created successfully with ID: %', created_order_id;
  
  -- If this is an order from a product, update product status to 'sold'
  IF p_product_id IS NOT NULL THEN
    UPDATE public.products 
    SET status = 'sold'
    WHERE id = p_product_id;
    RAISE LOG 'seller_create_order_v2: Product % status updated to sold', p_product_id;
  END IF;
  
  -- Advisory lock is automatically released at transaction end
  RETURN created_order_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in seller_create_order_v2: %', SQLERRM;
    RAISE;
END;
$$;