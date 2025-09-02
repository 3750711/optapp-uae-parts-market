-- Update all database functions to use the new custom domain for Edge Functions

-- Update notify_on_seller_confirmation function
CREATE OR REPLACE FUNCTION public.notify_on_seller_confirmation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Log trigger activation for debugging
  RAISE LOG 'Seller confirmation trigger fired: OLD.status=%, NEW.status=%', OLD.status, NEW.status;
  
  -- Only send notification when status changes to seller_confirmed
  IF (TG_OP = 'UPDATE' AND 
      OLD.status != 'seller_confirmed' AND 
      NEW.status = 'seller_confirmed') THEN
    
    RAISE LOG 'Sending seller confirmation notification for order %', NEW.id;
    
    -- Update timestamp for tracking
    NEW.last_notification_sent_at := NOW();
    
    -- Call edge function with full order data using custom domain
    PERFORM
      net.http_post(
        url:='https://api.partsbay.ae/functions/v1/send-telegram-notification',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
        body:=json_build_object(
          'order', json_build_object(
            'id', NEW.id,
            'order_number', NEW.order_number,
            'title', NEW.title,
            'price', NEW.price,
            'status', NEW.status,
            'created_at', NEW.created_at,
            'buyer_id', NEW.buyer_id,
            'seller_id', NEW.seller_id,
            'buyer_opt_id', NEW.buyer_opt_id,
            'seller_opt_id', NEW.seller_opt_id,
            'order_seller_name', NEW.order_seller_name,
            'telegram_url_buyer', NEW.telegram_url_buyer,
            'telegram_url_order', NEW.telegram_url_order,
            'brand', NEW.brand,
            'model', NEW.model,
            'delivery_method', NEW.delivery_method,
            'place_number', NEW.place_number,
            'text_order', NEW.text_order,
            'delivery_price_confirm', NEW.delivery_price_confirm,
            'images', NEW.images,
            'video_url', NEW.video_url,
            'order_created_type', NEW.order_created_type
          ),
          'action', 'status_change'
        )::jsonb
      );
      
    RAISE LOG 'Seller confirmation notification sent for order % with full order data', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in seller confirmation trigger: %', SQLERRM;
    RETURN NEW; -- Don't fail the transaction
END;
$function$;

-- Update notify_on_product_status_changes function (if it exists and makes HTTP calls)
CREATE OR REPLACE FUNCTION public.notify_on_product_status_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Only notify for 'active' status if product has images, or for 'sold' status
  IF (NEW.status = 'active' AND array_length(NEW.images, 1) > 0) OR NEW.status = 'sold' THEN
    -- Avoid sending notifications for 'pending' status
    IF OLD.status != 'pending' OR NEW.status != 'pending' THEN
      -- Only send notification if enough time has passed since last notification
      IF NEW.last_notification_sent_at IS NULL OR 
         NEW.last_notification_sent_at < NOW() - INTERVAL '1 hour' THEN
        
        -- Update the timestamp to avoid spam
        NEW.last_notification_sent_at := NOW();
        
        -- Send notification using custom domain
        PERFORM
          net.http_post(
            url := 'https://api.partsbay.ae/functions/v1/send-telegram-notification',
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
            body := json_build_object(
              'product', row_to_json(NEW),
              'action', 'status_change'
            )::jsonb
          );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;