-- Final cleanup: Update trigger functions to use functions_url() and remove hardcoded tokens

-- 1. Update create_price_offer_notification trigger function (no parameters)
CREATE OR REPLACE FUNCTION public.create_price_offer_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  seller_record RECORD;
  buyer_record RECORD;
  product_record RECORD;
BEGIN
  -- Get seller, buyer, and product details
  SELECT * INTO seller_record FROM public.profiles WHERE id = NEW.seller_id;
  SELECT * INTO buyer_record FROM public.profiles WHERE id = NEW.buyer_id;
  SELECT * INTO product_record FROM public.products WHERE id = NEW.product_id;
  
  -- Create notification for seller
  PERFORM create_bilingual_notification(
    NEW.seller_id,
    'PRICE_OFFER',
    jsonb_build_object(
      'offer_id', NEW.id,
      'product_id', NEW.product_id,
      'product_title', product_record.title,
      'buyer_name', buyer_record.full_name,
      'original_price', NEW.original_price,
      'offered_price', NEW.offered_price,
      'message', NEW.message,
      'url', '/price-offers/' || NEW.id
    )
  );
  
  -- Send Telegram notification to seller using functions_url()
  BEGIN
    PERFORM
      net.http_post(
        url := public.functions_url('notify-seller-new-price-offer'),
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := jsonb_build_object(
          'offerId', NEW.id,
          'sellerId', NEW.seller_id,
          'productId', NEW.product_id,
          'buyerId', NEW.buyer_id,
          'originalPrice', NEW.original_price,
          'offeredPrice', NEW.offered_price,
          'message', NEW.message
        )
      );
    RAISE LOG 'Telegram notification sent for price offer %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Error sending Telegram notification for price offer %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- 2. Update create_price_offer_status_notification trigger function (no parameters)
CREATE OR REPLACE FUNCTION public.create_price_offer_status_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only proceed for updates, not inserts
  IF TG_OP = 'UPDATE' THEN
    -- Handle status changes (existing logic)
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      -- Send status change notification
      PERFORM create_bilingual_notification(
        NEW.seller_id,
        'PRICE_OFFER_RESPONSE',
        jsonb_build_object(
          'offer_id', NEW.id,
          'product_id', NEW.product_id,
          'old_status', OLD.status,
          'status', NEW.status,
          'offered_price', NEW.offered_price,
          'original_price', NEW.original_price,
          'url', '/offers'
        )
      );

      -- Send Telegram notification for status changes using functions_url()
      BEGIN
        PERFORM
          net.http_post(
            url := public.functions_url('notify-price-offer-status-change'),
            headers := '{"Content-Type": "application/json"}'::jsonb,
            body := jsonb_build_object(
              'offerId', NEW.id,
              'sellerId', NEW.seller_id,
              'productId', NEW.product_id,
              'buyerId', NEW.buyer_id,
              'status', NEW.status,
              'oldStatus', OLD.status,
              'originalPrice', NEW.original_price,
              'offeredPrice', NEW.offered_price,
              'sellerResponse', NEW.seller_response
            )
          );
        RAISE LOG 'Telegram status notification sent for price offer %', NEW.id;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'Error sending Telegram status notification for price offer %: %', NEW.id, SQLERRM;
      END;
    END IF;

    -- Handle seller response changes
    IF OLD.seller_response IS DISTINCT FROM NEW.seller_response AND NEW.seller_response IS NOT NULL THEN
      -- Send notification to buyer about seller response
      PERFORM create_bilingual_notification(
        NEW.buyer_id,
        'PRICE_OFFER_RESPONSE',
        jsonb_build_object(
          'offer_id', NEW.id,
          'product_id', NEW.product_id,
          'status', NEW.status,
          'seller_response', NEW.seller_response,
          'offered_price', NEW.offered_price,
          'original_price', NEW.original_price,
          'url', '/offers'
        )
      );

      -- Send Telegram notification to buyer using functions_url()
      BEGIN
        PERFORM
          net.http_post(
            url := public.functions_url('notify-buyer-price-offer-response'),
            headers := '{"Content-Type": "application/json"}'::jsonb,
            body := jsonb_build_object(
              'offerId', NEW.id,
              'sellerId', NEW.seller_id,
              'productId', NEW.product_id,
              'buyerId', NEW.buyer_id,
              'status', NEW.status,
              'originalPrice', NEW.original_price,
              'offeredPrice', NEW.offered_price,
              'sellerResponse', NEW.seller_response
            )
          );
        RAISE LOG 'Telegram buyer response notification sent for price offer %', NEW.id;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'Error sending Telegram buyer response notification for price offer %: %', NEW.id, SQLERRM;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;