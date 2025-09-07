-- Simple forward migration to fix the main hardcoded URLs in functions
-- Focus on the most important functions first

-- Function: notify_on_product_status_changes (main product notification function)
CREATE OR REPLACE FUNCTION public.notify_on_product_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Send notification only when status changes to active or sold
  IF (TG_OP = 'UPDATE' AND 
      ((OLD.status != 'active' AND NEW.status = 'active') OR 
       (OLD.status != 'sold' AND NEW.status = 'sold'))) THEN
    
    -- If status changed to sold, send notification in any case, even without images
    -- For active status check if images exist
    IF (NEW.status = 'sold' OR 
        (NEW.status = 'active' AND EXISTS (
          SELECT 1 FROM product_images WHERE product_id = NEW.id LIMIT 1
        ))) THEN
      -- Update timestamp of last notification
      NEW.last_notification_sent_at := NOW();
      
      -- Determine notification type
      DECLARE
        notification_type TEXT;
      BEGIN
        IF NEW.status = 'sold' THEN
          notification_type := 'sold';
        ELSIF NEW.status = 'active' THEN
          notification_type := 'product_published';
        ELSE
          notification_type := 'status_change';
        END IF;
        
        -- Call Edge Function using public.functions_url() - FIXED HARDCODE
        PERFORM
          net.http_post(
            url := public.functions_url('send-telegram-notification'),
            headers := '{"Content-Type": "application/json"}'::jsonb,
            body := jsonb_build_object('productId', NEW.id, 'notificationType', notification_type)
          );
      END;
    ELSE
      -- If no images for active status, reset timestamp
      NEW.last_notification_sent_at := NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;