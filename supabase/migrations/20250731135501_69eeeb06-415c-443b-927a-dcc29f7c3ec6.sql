-- First, let's check the current trigger function for price offers
SELECT pg_get_functiondef(oid) as function_definition 
FROM pg_proc 
WHERE proname = 'create_price_offer_status_notification';

-- Update the price offer status notification function to handle price changes
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

      -- Send Telegram notification for status changes  
      BEGIN
        PERFORM
          net.http_post(
            url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/notify-seller-new-price-offer',
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
            body:=jsonb_build_object(
              'offerId', NEW.id,
              'productId', NEW.product_id,
              'sellerId', NEW.seller_id,
              'buyerId', NEW.buyer_id,
              'offeredPrice', NEW.offered_price,
              'originalPrice', NEW.original_price,
              'message', NEW.message,
              'expiresAt', NEW.expires_at,
              'notificationType', 'status_change'
            )
          );
      EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Failed to send telegram status change notification for offer %: %', NEW.id, SQLERRM;
      END;
    END IF;

    -- Handle price changes (new logic)
    IF OLD.offered_price IS DISTINCT FROM NEW.offered_price AND OLD.status = NEW.status THEN
      -- Send price change notification
      PERFORM create_bilingual_notification(
        NEW.seller_id,
        'PRICE_OFFER_RESPONSE',
        jsonb_build_object(
          'offer_id', NEW.id,
          'product_id', NEW.product_id,
          'old_price', OLD.offered_price,
          'offered_price', NEW.offered_price,
          'original_price', NEW.original_price,
          'url', '/offers'
        )
      );

      -- Send Telegram notification for price changes
      BEGIN
        PERFORM
          net.http_post(
            url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/notify-seller-new-price-offer',
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
            body:=jsonb_build_object(
              'offerId', NEW.id,
              'productId', NEW.product_id,
              'sellerId', NEW.seller_id,
              'buyerId', NEW.buyer_id,
              'offeredPrice', NEW.offered_price,
              'oldPrice', OLD.offered_price,
              'originalPrice', NEW.original_price,
              'message', NEW.message,
              'expiresAt', NEW.expires_at,
              'notificationType', 'price_update'
            )
          );
      EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Failed to send telegram price change notification for offer %: %', NEW.id, SQLERRM;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;