-- Fix price offer notifications to include product details
-- Update the price offer status notification function to include product information
CREATE OR REPLACE FUNCTION public.create_price_offer_status_notification()
RETURNS TRIGGER AS $$
DECLARE
  product_info RECORD;
  notification_title TEXT;
  notification_message TEXT;
  notification_type TEXT;
BEGIN
  -- Only process status changes (not new offers)
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Get product information
    SELECT 
      p.title,
      p.brand,
      p.model,
      p.price as original_price,
      p.seller_name,
      p.id as product_id
    INTO product_info
    FROM public.products p
    WHERE p.id = NEW.product_id;
    
    -- Determine notification type and create appropriate messages
    IF NEW.status = 'accepted' THEN
      notification_type := 'PRICE_OFFER_ACCEPTED';
      notification_title := 'Предложение принято!';
      notification_message := format('Ваше предложение %s₽ за %s %s %s принято продавцом. Теперь можно создать заказ.', 
        NEW.offered_price, 
        product_info.brand, 
        product_info.model, 
        product_info.title
      );
      
      -- Notify buyer about accepted offer
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        data
      ) VALUES (
        NEW.buyer_id,
        notification_type,
        notification_title,
        notification_message,
        jsonb_build_object(
          'offer_id', NEW.id,
          'product_id', NEW.product_id,
          'offered_price', NEW.offered_price,
          'original_price', NEW.original_price,
          'seller_response', NEW.seller_response,
          'product_title', product_info.title,
          'product_brand', product_info.brand,
          'product_model', product_info.model,
          'seller_name', product_info.seller_name,
          'order_creation_data', jsonb_build_object(
            'title', product_info.title,
            'price', NEW.offered_price,
            'brand', product_info.brand,
            'model', product_info.model,
            'seller_id', NEW.seller_id,
            'product_id', NEW.product_id
          )
        )
      );
      
      -- Also notify seller
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        data
      ) VALUES (
        NEW.seller_id,
        'PRICE_OFFER_ACCEPTED',
        'Вы приняли предложение',
        format('Вы приняли предложение %s₽ за %s %s %s. Покупатель может создать заказ.',
          NEW.offered_price,
          product_info.brand,
          product_info.model, 
          product_info.title
        ),
        jsonb_build_object(
          'offer_id', NEW.id,
          'product_id', NEW.product_id,
          'offered_price', NEW.offered_price,
          'product_title', product_info.title
        )
      );
      
    ELSIF NEW.status = 'rejected' THEN
      notification_type := 'PRICE_OFFER_RESPONSE';
      notification_title := 'Предложение отклонено';
      notification_message := format('Ваше предложение %s₽ за %s %s %s отклонено продавцом.',
        NEW.offered_price,
        product_info.brand,
        product_info.model,
        product_info.title
      );
      
      -- Notify buyer about rejected offer
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        data
      ) VALUES (
        NEW.buyer_id,
        notification_type,
        notification_title,
        notification_message,
        jsonb_build_object(
          'offer_id', NEW.id,
          'product_id', NEW.product_id,
          'offered_price', NEW.offered_price,
          'original_price', NEW.original_price,
          'seller_response', NEW.seller_response,
          'product_title', product_info.title,
          'product_brand', product_info.brand,
          'product_model', product_info.model,
          'seller_name', product_info.seller_name
        )
      );
      
    ELSIF NEW.status = 'expired' THEN
      notification_type := 'PRICE_OFFER_RESPONSE';
      notification_title := 'Срок предложения истек';
      notification_message := format('Срок действия вашего предложения %s₽ за "%s" (%s %s) истек. Вы можете отправить новое предложение.',
        NEW.offered_price,
        product_info.title,
        product_info.brand,
        product_info.model
      );
      
      -- Notify buyer about expired offer with product details
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        data
      ) VALUES (
        NEW.buyer_id,
        notification_type,
        notification_title,
        notification_message,
        jsonb_build_object(
          'offer_id', NEW.id,
          'product_id', NEW.product_id,
          'offered_price', NEW.offered_price,
          'original_price', NEW.original_price,
          'product_title', product_info.title,
          'product_brand', product_info.brand,
          'product_model', product_info.model,
          'seller_name', product_info.seller_name,
          'product_url', '/product/' || NEW.product_id,
          'can_make_new_offer', true
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_price_offer_status_notification ON public.price_offers;
CREATE TRIGGER trigger_price_offer_status_notification
  AFTER UPDATE ON public.price_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.create_price_offer_status_notification();

-- Also update the price offer creation notification to include product details
CREATE OR REPLACE FUNCTION public.create_price_offer_notification()
RETURNS TRIGGER AS $$
DECLARE
  product_info RECORD;
BEGIN
  -- Get product details
  SELECT 
    p.title,
    p.brand,
    p.model,
    p.price as original_price,
    p.seller_name
  INTO product_info
  FROM public.products p
  WHERE p.id = NEW.product_id;
  
  -- Notify seller about new price offer with detailed product info
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    NEW.seller_id,
    'PRICE_OFFER',
    'Новое предложение цены',
    format('Получено предложение %s₽ вместо %s₽ за "%s" (%s %s). Предложение действительно до %s.',
      NEW.offered_price,
      NEW.original_price,
      product_info.title,
      product_info.brand,
      product_info.model,
      to_char(NEW.expires_at, 'DD.MM.YYYY HH24:MI')
    ),
    jsonb_build_object(
      'offer_id', NEW.id,
      'product_id', NEW.product_id,
      'buyer_id', NEW.buyer_id,
      'offered_price', NEW.offered_price,
      'original_price', NEW.original_price,
      'expires_at', NEW.expires_at,
      'message', NEW.message,
      'product_title', product_info.title,
      'product_brand', product_info.brand,
      'product_model', product_info.model,
      'seller_name', product_info.seller_name
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;