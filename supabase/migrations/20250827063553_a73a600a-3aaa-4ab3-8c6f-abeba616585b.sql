-- Create function to notify registered order status changes
CREATE OR REPLACE FUNCTION public.notify_registered_order_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Send notification when order status becomes 'processed' (registered)
  IF (TG_OP = 'INSERT' AND NEW.status = 'processed') OR 
     (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'processed') THEN
    
    -- Call the registered order notification edge function
    PERFORM
      net.http_post(
        url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/send-registered-order-notification',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
        body:=jsonb_build_object(
          'order', jsonb_build_object(
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
          )
        )
      );
      
    RAISE LOG 'Registered order notification sent to group -2024698284 for order %', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in registered order notification trigger: %', SQLERRM;
    RETURN NEW; -- Don't fail the transaction
END;
$function$;

-- Create trigger for registered order notifications
DROP TRIGGER IF EXISTS trigger_notify_registered_order_status ON public.orders;
CREATE TRIGGER trigger_notify_registered_order_status
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_registered_order_status();