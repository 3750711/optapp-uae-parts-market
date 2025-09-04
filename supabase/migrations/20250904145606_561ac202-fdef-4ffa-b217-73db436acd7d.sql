-- Drop all existing admin_create_order functions to clean up duplicates
DROP FUNCTION IF EXISTS public.admin_create_order CASCADE;

-- Recreate the correct admin_create_order function with proper parameter order
CREATE OR REPLACE FUNCTION public.admin_create_order(
  p_title TEXT,
  p_price NUMERIC,
  p_seller_id UUID,
  p_buyer_id UUID,
  p_status order_status DEFAULT 'admin_confirmed',
  p_quantity INTEGER DEFAULT 1,
  p_delivery_method delivery_method DEFAULT 'self_pickup',
  p_place_number INTEGER DEFAULT 1,
  p_delivery_price_confirm NUMERIC DEFAULT NULL,
  p_product_id UUID DEFAULT NULL,
  p_brand TEXT DEFAULT '',
  p_model TEXT DEFAULT '',
  p_description TEXT DEFAULT NULL,
  p_images TEXT[] DEFAULT '{}',
  p_video_url TEXT[] DEFAULT '{}',
  p_text_order TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_id UUID;
  next_order_number INTEGER;
  sanitized_brand TEXT;
  sanitized_model TEXT;
  processed_images TEXT[];
  processed_delivery_price NUMERIC;
BEGIN
  RAISE LOG 'admin_create_order called with: title=%, price=%, seller_id=%, buyer_id=%, status=%', 
    p_title, p_price, p_seller_id, p_buyer_id, p_status;

  -- Validate required parameters
  IF p_title IS NULL OR TRIM(p_title) = '' THEN
    RAISE EXCEPTION 'Title cannot be empty';
  END IF;
  
  IF p_price IS NULL OR p_price <= 0 THEN
    RAISE EXCEPTION 'Price must be greater than 0';
  END IF;
  
  IF p_seller_id IS NULL THEN
    RAISE EXCEPTION 'Seller ID cannot be null';
  END IF;
  
  IF p_buyer_id IS NULL THEN
    RAISE EXCEPTION 'Buyer ID cannot be null';
  END IF;

  -- Validate order status enum
  IF p_status NOT IN ('created', 'seller_confirmed', 'admin_confirmed', 'processed', 'shipped', 'delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid order status: %', p_status;
  END IF;

  -- Get next order number
  BEGIN
    SELECT get_next_order_number() INTO next_order_number;
    RAISE LOG 'Generated order number: %', next_order_number;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error generating order number: %', SQLERRM;
    RAISE;
  END;

  -- Update product status if product_id is provided
  IF p_product_id IS NOT NULL THEN
    RAISE LOG 'Updating product % status to sold', p_product_id;
    UPDATE public.products
    SET status = 'sold'
    WHERE id = p_product_id;
  END IF;

  -- Sanitize brand and model
  sanitized_brand := COALESCE(TRIM(p_brand), '');
  sanitized_model := COALESCE(TRIM(p_model), '');
  
  -- Process images array
  processed_images := COALESCE(p_images, '{}');
  RAISE LOG 'Processed images array: %', processed_images;
  
  -- Process delivery price
  processed_delivery_price := CASE 
    WHEN p_delivery_price_confirm IS NOT NULL AND p_delivery_price_confirm > 0 
    THEN p_delivery_price_confirm 
    ELSE NULL 
  END;
  RAISE LOG 'Processed delivery price: %', processed_delivery_price;

  -- Insert the order
  BEGIN
    INSERT INTO public.orders (
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
      order_number,
      order_created_type
    ) VALUES (
      p_title,
      p_price,
      p_seller_id,
      p_buyer_id,
      p_status,
      p_quantity,
      p_delivery_method,
      p_place_number,
      processed_delivery_price,
      p_product_id,
      sanitized_brand,
      sanitized_model,
      p_description,
      processed_images,
      COALESCE(p_video_url, '{}'),
      p_text_order,
      next_order_number,
      CASE WHEN p_product_id IS NOT NULL THEN 'product_order' ELSE 'free_order' END
    ) RETURNING id INTO order_id;
    
    RAISE LOG 'Order created successfully with ID: %', order_id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error in admin_create_order: %', SQLERRM;
    RAISE;
  END;

  -- Create notifications
  BEGIN
    -- Notify buyer
    PERFORM create_bilingual_notification(
      p_buyer_id,
      'ORDER_CREATED',
      jsonb_build_object(
        'order_id', order_id,
        'order_number', next_order_number,
        'title', p_title,
        'price', p_price,
        'url', '/orders/' || order_id
      )
    );
    
    -- Notify seller  
    PERFORM create_bilingual_notification(
      p_seller_id,
      'NEW_ORDER',
      jsonb_build_object(
        'order_id', order_id,
        'order_number', next_order_number,
        'title', p_title,
        'price', p_price,
        'url', '/orders/' || order_id
      )
    );
    
    -- Send Telegram notification
    PERFORM net.http_post(
      url := 'https://api.partsbay.ae/functions/v1/send-telegram-notification',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'type', 'new_order',
        'order_id', order_id,
        'order_number', next_order_number,
        'title', p_title,
        'price', p_price,
        'seller_id', p_seller_id,
        'buyer_id', p_buyer_id
      )
    );
    
    RAISE LOG 'Telegram notification sent for new order %', order_id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error sending notifications: %', SQLERRM;
    -- Don't fail the entire operation for notification errors
  END;

  RETURN order_id;
  
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error in admin_create_order: %', SQLERRM;
  RAISE;
END;
$$;