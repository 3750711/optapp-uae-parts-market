
-- Fix the trigger function to remove original_price field and prevent double order creation
CREATE OR REPLACE FUNCTION public.create_order_from_accepted_offer()
RETURNS TRIGGER AS $$
DECLARE
  product_info RECORD;
  created_order_id UUID;
BEGIN
  -- Only process when status changes to 'accepted'
  IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
    -- Check if order already exists for this offer
    IF NEW.order_id IS NOT NULL THEN
      RETURN NEW;
    END IF;
    
    -- Get product information
    SELECT 
      p.title,
      p.brand,
      p.model,
      p.seller_id,
      p.delivery_price,
      p.place_number,
      prof.full_name as seller_name,
      prof.opt_id as seller_opt_id
    INTO product_info
    FROM public.products p
    JOIN public.profiles prof ON p.seller_id = prof.id
    WHERE p.id = NEW.product_id;
    
    -- Create order using seller_create_order function
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
      p_telegram_url_order := NULL,
      p_images := ARRAY[]::text[],
      p_product_id := NEW.product_id,
      p_delivery_method := 'self_pickup',
      p_text_order := 'Заказ создан из предложения цены. Оригинальная цена: ' || NEW.original_price || ', предложенная цена: ' || NEW.offered_price,
      p_delivery_price_confirm := product_info.delivery_price
    ) INTO created_order_id;
    
    -- Link the order to the offer
    NEW.order_id := created_order_id;
    
    RAISE LOG 'Order created from price offer: offer_id=%, order_id=%', NEW.id, created_order_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_create_order_from_accepted_offer ON public.price_offers;
CREATE TRIGGER trigger_create_order_from_accepted_offer
  BEFORE UPDATE ON public.price_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.create_order_from_accepted_offer();
