-- Fix create_order_from_accepted_offer function to include missing p_seller_id and p_seller_opt_id parameters
CREATE OR REPLACE FUNCTION public.create_order_from_accepted_offer()
RETURNS TRIGGER AS $$
DECLARE
  product_info RECORD;
  product_images text[];
  product_videos text[];
  created_order_id UUID;
BEGIN
  -- Only process when status changes to 'accepted'
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    -- Check if order already exists for this offer
    IF NEW.order_id IS NOT NULL THEN
      RETURN NEW;
    END IF;
    
    -- Get product information including images
    SELECT 
      p.title,
      p.brand,
      p.model,
      p.description,
      p.seller_id,
      p.delivery_price,
      p.place_number,
      prof.full_name as seller_name,
      prof.opt_id as seller_opt_id,
      prof.telegram as seller_telegram,
      COALESCE(array_agg(pi.url ORDER BY pi.is_primary DESC, pi.created_at) FILTER (WHERE pi.url IS NOT NULL), '{}') as images
    INTO product_info
    FROM public.products p
    JOIN public.profiles prof ON p.seller_id = prof.id
    LEFT JOIN public.product_images pi ON p.id = pi.product_id
    WHERE p.id = NEW.product_id
    GROUP BY p.id, prof.id;
    
    -- Get product videos
    SELECT COALESCE(array_agg(pv.url ORDER BY pv.created_at), '{}')
    INTO product_videos
    FROM public.product_videos pv
    WHERE pv.product_id = NEW.product_id;
    
    -- Log the delivery method and video count being used
    RAISE LOG 'Creating order from accepted offer: offer_id=%, delivery_method=%, product_id=%, video_count=%', 
      NEW.id, NEW.delivery_method, NEW.product_id, array_length(product_videos, 1);
    
    -- Create order using seller_create_order function with all required parameters
    SELECT seller_create_order(
      p_title := product_info.title,
      p_price := NEW.offered_price,
      p_place_number := COALESCE(product_info.place_number, 1),
      p_seller_id := product_info.seller_id,
      p_order_seller_name := product_info.seller_name,
      p_seller_opt_id := product_info.seller_opt_id,
      p_buyer_id := NEW.buyer_id,
      p_brand := COALESCE(product_info.brand, ''),
      p_model := COALESCE(product_info.model, ''),
      p_status := 'seller_confirmed',
      p_order_created_type := 'price_offer_order',
      p_telegram_url_order := product_info.seller_telegram,
      p_images := product_info.images,
      p_product_id := NEW.product_id,
      p_delivery_method := NEW.delivery_method,
      p_text_order := COALESCE(
        'Заказ создан из предложения цены.' || 
        CASE WHEN NEW.message IS NOT NULL THEN ' Сообщение: ' || NEW.message ELSE '' END ||
        CASE WHEN product_info.description IS NOT NULL THEN ' Описание: ' || product_info.description ELSE '' END,
        'Заказ создан из предложения цены'
      ),
      p_delivery_price_confirm := product_info.delivery_price,
      p_videos := product_videos
    ) INTO created_order_id;
    
    -- Link the order to the offer
    NEW.order_id := created_order_id;
    
    RAISE LOG 'Order created successfully from price offer: offer_id=%, order_id=%, delivery_method=%, videos_transferred=%', 
      NEW.id, created_order_id, NEW.delivery_method, COALESCE(array_length(product_videos, 1), 0);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;