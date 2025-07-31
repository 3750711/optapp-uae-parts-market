-- Create function to notify when admin creates active product
CREATE OR REPLACE FUNCTION public.notify_for_admin_created_product()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only proceed if this is an INSERT operation with active status
  IF (TG_OP = 'INSERT' AND NEW.status = 'active') THEN
    
    -- Check if the current user is an admin
    IF EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    ) THEN
      
      -- Check if product has images before sending notification
      IF EXISTS (
        SELECT 1 FROM product_images WHERE product_id = NEW.id LIMIT 1
      ) THEN
        
        -- Update notification timestamp
        NEW.last_notification_sent_at := NOW();
        
        -- Send notification to Telegram group via Edge Function
        BEGIN
          PERFORM
            net.http_post(
              url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/send-telegram-notification',
              headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
              body:=json_build_object('productId', NEW.id, 'notificationType', 'product_published')::jsonb
            );
        EXCEPTION WHEN OTHERS THEN
          -- Log error but don't block the main operation
          RAISE LOG 'Failed to send telegram notification for admin-created product %: %', NEW.id, SQLERRM;
        END;
        
      ELSE
        -- If no images, don't set notification timestamp
        NEW.last_notification_sent_at := NULL;
      END IF;
      
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for admin-created products
CREATE TRIGGER trigger_notify_admin_created_product
BEFORE INSERT ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.notify_for_admin_created_product();