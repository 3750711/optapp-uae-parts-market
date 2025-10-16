-- Update notify_on_product_status_changes to use proxy Edge Function instead of direct QStash
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

  -- Check for images if product_published
  IF notification_type = 'product_published' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.product_images WHERE product_id = NEW.id LIMIT 1
    ) THEN
      RAISE WARNING '[notify_on_product_status_changes] Product % has no images', NEW.id;
      NEW.last_notification_sent_at := NULL;
      RETURN NEW;
    END IF;
  END IF;

  -- Update timestamp
  NEW.last_notification_sent_at := NOW();

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