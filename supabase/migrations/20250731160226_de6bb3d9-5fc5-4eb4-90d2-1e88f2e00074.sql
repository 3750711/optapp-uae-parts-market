-- Drop the problematic separate trigger
DROP TRIGGER IF EXISTS trigger_notify_admin_created_product ON public.products;
DROP FUNCTION IF EXISTS public.notify_for_admin_created_product() CASCADE;

-- Update the main notification function to handle INSERT with active status
CREATE OR REPLACE FUNCTION public.notify_on_product_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Handle INSERT operations with active status (admin-created or auto-approved products)
  IF (TG_OP = 'INSERT' AND NEW.status = 'active') THEN
    
    -- Check if product has images before sending notification
    IF EXISTS (
      SELECT 1 FROM product_images WHERE product_id = NEW.id LIMIT 1
    ) THEN
      -- Update notification timestamp
      NEW.last_notification_sent_at := NOW();
      
      -- Send notification for published product
      BEGIN
        PERFORM
          net.http_post(
            url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/send-telegram-notification',
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
            body:=json_build_object('productId', NEW.id, 'notificationType', 'product_published')::jsonb
          );
      EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Failed to send telegram notification for product %: %', NEW.id, SQLERRM;
      END;
    ELSE
      -- If no images, don't set notification timestamp
      NEW.last_notification_sent_at := NULL;
    END IF;
    
  -- Handle UPDATE operations (existing logic)
  ELSIF (TG_OP = 'UPDATE' AND 
         ((OLD.status != 'active' AND NEW.status = 'active') OR 
          (OLD.status != 'sold' AND NEW.status = 'sold'))) THEN
    
    -- If status changed to sold, send notification regardless of images
    -- For active status, check images existence
    IF (NEW.status = 'sold' OR 
        (NEW.status = 'active' AND EXISTS (
          SELECT 1 FROM product_images WHERE product_id = NEW.id LIMIT 1
        ))) THEN
      -- Update notification timestamp
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
        
        -- Send notification via Edge Function
        PERFORM
          net.http_post(
            url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/send-telegram-notification',
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
            body:=json_build_object('productId', NEW.id, 'notificationType', notification_type)::jsonb
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

-- Recreate the trigger to work on both INSERT and UPDATE
DROP TRIGGER IF EXISTS trigger_notify_on_product_status_changes ON public.products;
CREATE TRIGGER trigger_notify_on_product_status_changes
AFTER INSERT OR UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_product_status_changes();