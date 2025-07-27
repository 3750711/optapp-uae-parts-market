-- Add cancelled status to price_offers if not already present
-- Update any existing pending offers for sold products to cancelled status

-- First, let's create a function to cancel price offers for a sold product
CREATE OR REPLACE FUNCTION public.cancel_price_offers_for_sold_product(product_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cancelled_count INTEGER := 0;
  offer_record RECORD;
BEGIN
  -- Update all pending offers for this product to cancelled
  UPDATE public.price_offers 
  SET 
    status = 'cancelled',
    updated_at = NOW(),
    seller_response = 'Product has been sold'
  WHERE product_id = product_id_param 
    AND status = 'pending'
  RETURNING * INTO cancelled_count;
  
  GET DIAGNOSTICS cancelled_count = ROW_COUNT;
  
  -- Send notifications to buyers whose offers were cancelled
  FOR offer_record IN 
    SELECT id, buyer_id, offered_price, product_id
    FROM public.price_offers 
    WHERE product_id = product_id_param 
      AND status = 'cancelled'
      AND updated_at >= NOW() - INTERVAL '1 minute'
  LOOP
    -- Create notification for the buyer
    PERFORM create_bilingual_notification(
      offer_record.buyer_id,
      'PRICE_OFFER_CANCELLED',
      jsonb_build_object(
        'offer_id', offer_record.id,
        'product_id', offer_record.product_id,
        'offered_price', offer_record.offered_price,
        'reason', 'product_sold'
      )
    );
  END LOOP;
  
  RETURN cancelled_count;
END;
$$;

-- Update the existing notify_on_product_status_changes function to cancel offers
CREATE OR REPLACE FUNCTION public.notify_on_product_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cancelled_offers_count INTEGER := 0;
BEGIN
  -- Only proceed if this is an update and status has changed
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- If product status changed to 'sold', cancel all pending price offers
    IF NEW.status = 'sold' THEN
      SELECT cancel_price_offers_for_sold_product(NEW.id) INTO cancelled_offers_count;
      RAISE LOG 'Cancelled % price offers for sold product %', cancelled_offers_count, NEW.id;
    END IF;
    
    -- Only send Telegram notification for products that have images or are being marked as sold
    -- and haven't been notified recently (within last hour)
    IF (NEW.status = 'active' AND EXISTS (
        SELECT 1 FROM product_images WHERE product_id = NEW.id
      )) OR 
      (NEW.status = 'sold') THEN
      
      -- Check if we should send notification (not sent within last hour)
      IF OLD.last_notification_sent_at IS NULL OR 
         OLD.last_notification_sent_at < NOW() - INTERVAL '1 hour' THEN
        
        -- Update the notification timestamp
        NEW.last_notification_sent_at := NOW();
        
        -- Call the edge function for Telegram notification
        PERFORM
          net.http_post(
            url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/send-product-sold-notification',
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || 
              current_setting('app.settings.service_role_key', true) || '"}',
            body:=json_build_object(
              'product_id', NEW.id,
              'title', NEW.title,
              'price', NEW.price,
              'seller_name', NEW.seller_name,
              'status', NEW.status,
              'old_status', OLD.status,
              'product_url', NEW.product_url,
              'cancelled_offers_count', cancelled_offers_count
            )::text
          );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Cancel all existing pending offers for products that are already sold
UPDATE public.price_offers 
SET 
  status = 'cancelled',
  updated_at = NOW(),
  seller_response = 'Product has been sold'
WHERE status = 'pending' 
  AND product_id IN (
    SELECT id FROM public.products WHERE status = 'sold'
  );