-- Fix duplicate notifications: update trigger to use AFTER logic and separate UPDATE
-- This prevents trigger from firing multiple times

-- Drop existing trigger
DROP TRIGGER IF EXISTS trigger_notify_on_product_status_changes ON public.products;

-- Update function to use AFTER logic with separate UPDATE
CREATE OR REPLACE FUNCTION public.notify_on_product_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  notification_type TEXT;
BEGIN
  -- Determine notification type
  IF TG_OP = 'UPDATE' AND OLD.status != 'active' AND NEW.status = 'active' THEN
    notification_type := 'product_published';
    RAISE LOG '[notify_on_product_status_changes] Product % changed to active', NEW.id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'sold' AND NEW.status = 'sold' THEN
    notification_type := 'sold';
    RAISE LOG '[notify_on_product_status_changes] Product % changed to sold', NEW.id;
  ELSE
    RETURN NEW;
  END IF;

  -- Prevent duplicate notifications: check if notification was recently sent
  IF NEW.last_notification_sent_at IS NOT NULL 
     AND NEW.last_notification_sent_at > (NOW() - INTERVAL '10 seconds') THEN
    RAISE LOG '[notify_on_product_status_changes] Notification recently sent (within 10 sec), skipping';
    RETURN NEW;
  END IF;

  -- Check for images if product_published
  IF notification_type = 'product_published' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.product_images WHERE product_id = NEW.id LIMIT 1
    ) THEN
      RAISE WARNING '[notify_on_product_status_changes] Product % has no images', NEW.id;
      RETURN NEW;
    END IF;
  END IF;

  -- Update timestamp with separate UPDATE (not modifying NEW to prevent re-trigger)
  UPDATE public.products 
  SET last_notification_sent_at = NOW() 
  WHERE id = NEW.id;

  -- Send through proxy Edge Function
  BEGIN
    PERFORM net.http_post(
      url := public.functions_url('/functions/v1/send-telegram-notification'),
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := jsonb_build_object(
        'productId', NEW.id,
        'notificationType', notification_type
      )
    );
    
    RAISE LOG '[notify_on_product_status_changes] Queued % notification for product %', notification_type, NEW.id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[notify_on_product_status_changes] Failed to queue notification: %', SQLERRM;
  END;

  RETURN NEW;
END;
$function$;

-- Re-create trigger as AFTER UPDATE
CREATE TRIGGER trigger_notify_on_product_status_changes
AFTER UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_product_status_changes();