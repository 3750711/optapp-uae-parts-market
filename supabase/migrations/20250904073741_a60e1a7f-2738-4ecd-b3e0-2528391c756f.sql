-- Update all hardcoded Supabase URLs to use new CDN domain api.partsbay.ae

-- Update notify_pusher_price_offer_changes function
CREATE OR REPLACE FUNCTION public.notify_pusher_price_offer_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  channel_name TEXT;
  event_data JSONB;
BEGIN
  -- Only notify on updates, not inserts
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Create channel name for the buyer
    channel_name := 'price-offer-' || NEW.buyer_id::text;
    
    -- Prepare event data
    event_data := jsonb_build_object(
      'offer_id', NEW.id,
      'product_id', NEW.product_id,
      'status', NEW.status,
      'seller_response', NEW.seller_response,
      'updated_at', NEW.updated_at
    );
    
    -- Send real-time notification via Edge Function
    BEGIN
      PERFORM
        net.http_post(
          url:='https://api.partsbay.ae/functions/v1/send-pusher-notification',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
          body:=jsonb_build_object(
            'channel', channel_name,
            'event', 'price-offer-updated',
            'data', event_data
          )
        );
      RAISE LOG 'Pusher notification sent for price offer % status change to %', NEW.id, NEW.status;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Error sending Pusher notification for price offer %: %', NEW.id, SQLERRM;
    END;

    -- Also send notification to seller channel
    channel_name := 'price-offer-seller-' || NEW.seller_id::text;
    
    BEGIN
      PERFORM
        net.http_post(
          url:='https://api.partsbay.ae/functions/v1/send-pusher-notification',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
          body:=jsonb_build_object(
            'channel', channel_name,
            'event', 'price-offer-updated',
            'data', event_data
          )
        );
      RAISE LOG 'Pusher notification sent to seller for price offer %', NEW.id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Error sending Pusher notification to seller for price offer %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;