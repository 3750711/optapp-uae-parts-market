-- Fix notify_on_product_status_changes trigger to properly send Telegram notifications

CREATE OR REPLACE FUNCTION public.notify_on_product_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_type TEXT;
BEGIN
  -- Only process status changes to 'active' or 'sold'
  IF (TG_OP = 'UPDATE' AND 
      ((OLD.status != 'active' AND NEW.status = 'active') OR 
       (OLD.status != 'sold' AND NEW.status = 'sold'))) THEN
    
    -- Check if we should send notification (for 'sold' or 'active' with images)
    IF (NEW.status = 'sold' OR 
        (NEW.status = 'active' AND EXISTS (
          SELECT 1 FROM product_images WHERE product_id = NEW.id LIMIT 1
        ))) THEN
      
      -- Update timestamp and attempt counter
      NEW.last_notification_sent_at := NOW();
      NEW.tg_notify_attempts := COALESCE(NEW.tg_notify_attempts, 0) + 1;
      NEW.tg_notify_status := 'sending';
      
      -- Determine notification type
      IF NEW.status = 'sold' THEN
        notification_type := 'sold';
      ELSIF NEW.status = 'active' THEN
        notification_type := 'product_published';
      ELSE
        notification_type := 'status_change';
      END IF;
      
      RAISE LOG 'Sending Telegram notification for product LOT #%, type: %', NEW.lot_number, notification_type;
      
      -- Send notification via Edge Function with correct URL
      BEGIN
        PERFORM net.http_post(
          url := public.functions_url('/functions/v1/send-telegram-notification'),
          headers := '{"Content-Type": "application/json"}'::jsonb,
          body := jsonb_build_object(
            'productId', NEW.id, 
            'notificationType', notification_type
          )
        );
        
        RAISE LOG 'Successfully triggered Telegram notification for LOT #%', NEW.lot_number;
        NEW.tg_notify_status := 'sent';
        NEW.tg_notify_error := NULL;
        
      EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Error sending Telegram notification for LOT #%: %', NEW.lot_number, SQLERRM;
        NEW.tg_notify_status := 'error';
        NEW.tg_notify_error := SQLERRM;
        
        -- Log error to event_logs
        INSERT INTO event_logs (
          action_type,
          entity_type,
          entity_id,
          details
        ) VALUES (
          'telegram_notification_error',
          'product',
          NEW.id,
          jsonb_build_object(
            'lot_number', NEW.lot_number,
            'error', SQLERRM,
            'notification_type', notification_type
          )
        );
      END;
    ELSE
      -- No images, can't send notification
      NEW.last_notification_sent_at := NULL;
      NEW.tg_notify_status := 'no_images';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger as BEFORE instead of AFTER to allow NEW modifications
DROP TRIGGER IF EXISTS trigger_notify_on_product_status_changes ON public.products;

CREATE TRIGGER trigger_notify_on_product_status_changes
BEFORE INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_product_status_changes();