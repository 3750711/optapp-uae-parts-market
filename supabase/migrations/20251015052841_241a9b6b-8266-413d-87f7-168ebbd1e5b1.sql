-- Fix product notification trigger to prevent premature timestamp updates
-- Remove last_notification_sent_at updates from trigger
-- Timestamp should ONLY be updated by Edge Function after successful Telegram send

CREATE OR REPLACE FUNCTION public.notify_on_product_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Send notification only when status changes to:
  -- 1. active (published) - will send full announcement with images
  -- 2. sold - will send sold notification
  -- DO NOT send notifications when changing to pending (moderation)
  IF (TG_OP = 'UPDATE' AND 
      ((OLD.status != 'active' AND NEW.status = 'active') OR 
       (OLD.status != 'sold' AND NEW.status = 'sold'))) THEN
    
    -- For sold status, send notification regardless of images
    -- For active status, check if images exist
    IF (NEW.status = 'sold' OR 
        (NEW.status = 'active' AND EXISTS (
          SELECT 1 FROM product_images WHERE product_id = NEW.id LIMIT 1
        ))) THEN
      
      -- Determine notification type
      DECLARE
        notification_type TEXT;
      BEGIN
        IF NEW.status = 'sold' THEN
          notification_type := 'sold';
        ELSIF NEW.status = 'active' THEN
          -- For active status send full announcement, not just status_change
          notification_type := 'product_published';
        ELSE
          notification_type := 'status_change';
        END IF;
        
        -- Call Edge Function to send notification
        -- Edge Function will update last_notification_sent_at ONLY after successful send
        PERFORM
          net.http_post(
            url := public.functions_url('send-telegram-notification'),
            headers := '{"Content-Type": "application/json"}'::jsonb,
            body := jsonb_build_object('productId', NEW.id, 'notificationType', notification_type)
          );
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;