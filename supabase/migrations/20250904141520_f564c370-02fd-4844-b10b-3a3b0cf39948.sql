-- Drop all existing versions of admin_create_order to resolve function overloading conflict
DROP FUNCTION IF EXISTS public.admin_create_order(p_title text, p_price numeric, p_place_number integer, p_seller_id uuid, p_order_seller_name text, p_seller_opt_id text, p_buyer_id uuid, p_brand text, p_model text, p_status order_status, p_order_created_type order_created_type, p_telegram_url_order text, p_images text[], p_product_id uuid, p_delivery_method delivery_method, p_text_order text, p_delivery_price_confirm numeric, p_videos text[]);

-- Recreate the correct version that matches the code expectations
CREATE OR REPLACE FUNCTION public.admin_create_order(
  p_title text,
  p_price numeric,
  p_seller_id uuid,
  p_buyer_id uuid,
  p_description text DEFAULT NULL::text,
  p_order_seller_name text DEFAULT NULL::text,
  p_seller_opt_id text DEFAULT NULL::text,
  p_brand text DEFAULT ''::text,
  p_model text DEFAULT ''::text,
  p_status order_status DEFAULT 'created'::order_status,
  p_order_created_type order_created_type DEFAULT 'free_order'::order_created_type,
  p_delivery_method delivery_method DEFAULT 'self_pickup'::delivery_method,
  p_place_number integer DEFAULT 1,
  p_text_order text DEFAULT NULL::text,
  p_delivery_price_confirm numeric DEFAULT NULL::numeric,
  p_telegram_url_order text DEFAULT NULL::text,
  p_images text[] DEFAULT ARRAY[]::text[],
  p_videos text[] DEFAULT ARRAY[]::text[],
  p_product_id uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  order_id uuid;
  next_order_number integer;
  sanitized_brand text;
  sanitized_model text;
  processed_images text[];
  processed_delivery_price numeric;
BEGIN
  -- Check that user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can use this function';
  END IF;

  -- Validate order status
  IF p_status::text NOT IN ('created', 'seller_confirmed', 'admin_confirmed', 'processed', 'shipped', 'delivered', 'cancelled') THEN
    RAISE LOG 'Invalid order status provided: %, defaulting to created', p_status;
    p_status := 'created'::order_status;
  END IF;

  -- Log parameters for debugging
  RAISE LOG 'admin_create_order called with: title=%, price=%, seller_id=%, buyer_id=%, status=%', 
    p_title, p_price, p_seller_id, p_buyer_id, p_status;
  
  -- If product_id is specified, mark product as sold
  IF p_product_id IS NOT NULL THEN
    RAISE LOG 'Updating product % status to sold', p_product_id;
    
    UPDATE public.products
    SET status = 'sold'
    WHERE id = p_product_id
    AND status != 'sold';
    
    IF NOT FOUND THEN
      RAISE LOG 'Product % not found or already sold', p_product_id;
    END IF;
  END IF;

  -- Sanitize brand and model fields
  sanitized_brand := COALESCE(NULLIF(TRIM(p_brand), ''), '');
  sanitized_model := COALESCE(NULLIF(TRIM(p_model), ''), '');

  -- Process images array
  processed_images := COALESCE(p_images, ARRAY[]::text[]);
  RAISE LOG 'Processed images array: %', processed_images;

  -- Process delivery price
  processed_delivery_price := p_delivery_price_confirm;
  RAISE LOG 'Processed delivery price: %', processed_delivery_price;

  -- Get next order number
  SELECT get_next_order_number() INTO next_order_number;
  RAISE LOG 'Generated order number: %', next_order_number;

  -- Insert the order
  INSERT INTO public.orders (
    title,
    price,
    description,
    seller_id,
    order_seller_name,
    seller_opt_id, 
    buyer_id,
    brand,
    model,
    status,
    order_created_type,
    delivery_method,
    place_number,
    text_order,
    delivery_price_confirm,
    telegram_url_order,
    images,
    video_url,
    product_id,
    order_number
  ) VALUES (
    p_title,
    p_price,
    p_description,
    p_seller_id,
    COALESCE(p_order_seller_name, 'Unknown Seller'),
    p_seller_opt_id,
    p_buyer_id,
    sanitized_brand,
    sanitized_model,
    p_status,
    p_order_created_type,
    p_delivery_method,
    p_place_number,
    p_text_order,
    processed_delivery_price,
    p_telegram_url_order,
    processed_images,
    p_videos,
    p_product_id,
    next_order_number
  ) RETURNING id INTO order_id;

  RAISE LOG 'Created order with ID: % and order number: %', order_id, next_order_number;

  RETURN order_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in admin_create_order: %', SQLERRM;
    RAISE;
END;
$$;