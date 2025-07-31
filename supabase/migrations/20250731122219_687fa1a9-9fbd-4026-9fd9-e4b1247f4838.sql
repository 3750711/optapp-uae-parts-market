-- Update the create_price_offer_notification function to include Telegram notifications
CREATE OR REPLACE FUNCTION public.create_price_offer_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create the bilingual notification first
  PERFORM create_bilingual_notification(
    NEW.seller_id,
    'PRICE_OFFER',
    jsonb_build_object(
      'offer_id', NEW.id,
      'product_id', NEW.product_id,
      'buyer_id', NEW.buyer_id,
      'offered_price', NEW.offered_price,
      'original_price', NEW.original_price,
      'message', NEW.message,
      'expires_at', NEW.expires_at
    )
  );
  
  -- Send Telegram notification to seller
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
          'expiresAt', NEW.expires_at
        )
      );
  EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the main operation
    RAISE LOG 'Failed to send Telegram notification for price offer %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS price_offer_notification_trigger ON public.price_offers;
CREATE TRIGGER price_offer_notification_trigger
  AFTER INSERT ON public.price_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.create_price_offer_notification();