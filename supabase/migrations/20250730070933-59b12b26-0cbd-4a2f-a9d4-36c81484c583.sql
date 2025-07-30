-- Fix price offer cancellation and notification issues

-- 1. Create/Update function to cancel price offers for sold products
CREATE OR REPLACE FUNCTION public.cancel_price_offers_for_sold_product()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log the trigger activation
  RAISE LOG 'cancel_price_offers_for_sold_product triggered for product %, status: %', NEW.id, NEW.status;
  
  -- Only proceed if status changed to 'sold'
  IF NEW.status = 'sold' THEN
    -- Cancel all pending price offers for this product
    UPDATE public.price_offers
    SET 
      status = 'cancelled',
      seller_response = 'Product has been sold.',
      updated_at = now()
    WHERE product_id = NEW.id 
    AND status = 'pending';
    
    -- Log how many offers were cancelled
    RAISE LOG 'Cancelled % pending offers for product %', (SELECT COUNT(*) FROM public.price_offers WHERE product_id = NEW.id AND status = 'cancelled'), NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for cancelling offers when product is sold
DROP TRIGGER IF EXISTS trigger_cancel_offers_on_sold ON public.products;
CREATE TRIGGER trigger_cancel_offers_on_sold
AFTER UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.cancel_price_offers_for_sold_product();

-- 2. Update the main notification function to ensure proper flow
CREATE OR REPLACE FUNCTION public.notify_on_product_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RAISE LOG 'notify_on_product_status_changes triggered: TG_OP=%, OLD.status=%, NEW.status=%', TG_OP, 
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END, NEW.status;
  
  -- Send notifications when:
  -- 1. On UPDATE: status changes to active or sold
  -- 2. On INSERT: status is active or sold
  IF (TG_OP = 'UPDATE' AND 
      ((OLD.status != 'active' AND NEW.status = 'active') OR 
       (OLD.status != 'sold' AND NEW.status = 'sold'))) OR
     (TG_OP = 'INSERT' AND NEW.status IN ('active', 'sold')) THEN
    
    -- For sold status, always send notification even without images
    -- For other statuses, check if images exist
    IF (NEW.status = 'sold' OR EXISTS (
      SELECT 1 FROM product_images WHERE product_id = NEW.id LIMIT 1
    )) THEN
      -- Update timestamp
      NEW.last_notification_sent_at := NOW();
      
      -- Determine notification type
      DECLARE
        notification_type TEXT;
      BEGIN
        IF NEW.status = 'sold' THEN
          notification_type := 'sold';
        ELSE
          notification_type := 'status_change';
        END IF;
        
        RAISE LOG 'Sending Telegram notification for product % with type %', NEW.id, notification_type;
        
        -- Call Edge Function for sending notification
        PERFORM
          net.http_post(
            url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/send-telegram-notification',
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
            body:=json_build_object('productId', NEW.id, 'notificationType', notification_type)::jsonb
          );
      END;
    ELSE
      -- Reset timestamp if no images and not sold
      NEW.last_notification_sent_at := NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Create function to clean up orphaned pending offers
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_pending_offers()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected_count integer;
BEGIN
  -- Cancel pending offers for products that are already sold
  UPDATE public.price_offers
  SET 
    status = 'cancelled',
    seller_response = 'Product has been sold.',
    updated_at = now()
  WHERE status = 'pending'
  AND product_id IN (
    SELECT id FROM public.products WHERE status = 'sold'
  );
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  
  RAISE LOG 'Cleaned up % orphaned pending offers', affected_count;
  
  RETURN affected_count;
END;
$$;

-- 4. Run cleanup for existing data
SELECT public.cleanup_orphaned_pending_offers();

-- 5. Create function to get next order number safely
CREATE OR REPLACE FUNCTION public.get_next_order_number()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number integer;
BEGIN
  -- Get the next available order number
  SELECT COALESCE(MAX(order_number), 0) + 1 
  INTO next_number 
  FROM public.orders;
  
  RETURN next_number;
END;
$$;

-- 6. Add index for better performance on price offer status queries
CREATE INDEX IF NOT EXISTS idx_price_offers_product_status 
ON public.price_offers(product_id, status);

-- 7. Add index for better performance on product status queries
CREATE INDEX IF NOT EXISTS idx_products_status 
ON public.products(status);

-- Log completion
DO $$
BEGIN
  RAISE LOG 'Price offer fix migration completed successfully';
END;
$$;