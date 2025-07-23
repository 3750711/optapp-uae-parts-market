
-- Add delivery_method column to price_offers table
ALTER TABLE public.price_offers 
ADD COLUMN delivery_method delivery_method NOT NULL DEFAULT 'self_pickup';

-- Update the trigger to use the delivery method from the offer
CREATE OR REPLACE FUNCTION public.create_order_from_accepted_offer()
RETURNS TRIGGER AS $$
DECLARE
  product_info RECORD;
  product_images text[];
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
    
    -- Log the delivery method being used
    RAISE LOG 'Creating order from accepted offer: offer_id=%, delivery_method=%, product_id=%', 
      NEW.id, NEW.delivery_method, NEW.product_id;
    
    -- Create order using seller_create_order function with the delivery method from the offer
    SELECT seller_create_order(
      p_title := product_info.title,
      p_price := NEW.offered_price,
      p_place_number := COALESCE(product_info.place_number, 1),
      p_order_seller_name := product_info.seller_name,
      p_buyer_id := NEW.buyer_id,
      p_brand := COALESCE(product_info.brand, ''),
      p_model := COALESCE(product_info.model, ''),
      p_status := 'seller_confirmed',
      p_order_created_type := 'price_offer_order',
      p_telegram_url_order := product_info.seller_telegram,
      p_images := product_info.images,
      p_product_id := NEW.product_id,
      p_delivery_method := NEW.delivery_method, -- Use delivery method from the offer
      p_text_order := COALESCE(
        'Заказ создан из предложения цены.' || 
        CASE WHEN NEW.message IS NOT NULL THEN ' Сообщение: ' || NEW.message ELSE '' END ||
        CASE WHEN product_info.description IS NOT NULL THEN ' Описание: ' || product_info.description ELSE '' END,
        'Заказ создан из предложения цены'
      ),
      p_delivery_price_confirm := product_info.delivery_price
    ) INTO created_order_id;
    
    -- Link the order to the offer
    NEW.order_id := created_order_id;
    
    RAISE LOG 'Order created successfully from price offer: offer_id=%, order_id=%, delivery_method=%', 
      NEW.id, created_order_id, NEW.delivery_method;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
