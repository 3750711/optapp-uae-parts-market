-- Fix seller confirmation trigger by removing non-existent updated_at field
-- Drop in correct order: trigger first, then function

-- Drop the trigger first
DROP TRIGGER IF EXISTS trigger_notify_on_seller_confirmation ON public.orders;

-- Now drop the function
DROP FUNCTION IF EXISTS public.notify_on_seller_confirmation();

-- Create improved function that sends full order object WITHOUT updated_at field
CREATE OR REPLACE FUNCTION public.notify_on_seller_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
    
    -- Call edge function with full order data (removed updated_at field)
    PERFORM
      net.http_post(
        url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/send-telegram-notification',
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
$$;

-- Recreate the trigger
CREATE TRIGGER trigger_notify_on_seller_confirmation
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_seller_confirmation();