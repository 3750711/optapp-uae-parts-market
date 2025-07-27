-- Fix duplicate Telegram notifications
-- Remove duplicate triggers and fix recursive timestamp updates

-- 1. Drop the duplicate/problematic trigger
DROP TRIGGER IF EXISTS product_status_notification_trigger ON public.products;

-- 2. Update the function to NOT modify last_notification_sent_at 
-- (this will be done in Edge Function after successful send)
CREATE OR REPLACE FUNCTION public.notify_on_product_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log trigger activation for debugging
  RAISE LOG 'Product status change trigger fired: product_id=%, OLD.status=%, NEW.status=%', NEW.id, OLD.status, NEW.status;
  
  -- Send notification for ANY status change (not just active/sold)
  -- Added check to prevent duplicate notifications within same transaction
  IF (TG_OP = 'UPDATE' AND 
      OLD.status IS DISTINCT FROM NEW.status AND
      -- Prevent duplicate calls if timestamp was just updated
      (OLD.last_notification_sent_at IS NULL OR 
       OLD.last_notification_sent_at < (NOW() - INTERVAL '10 seconds'))) THEN
    
    RAISE LOG 'Status changed for product %: % -> %', NEW.id, OLD.status, NEW.status;
    
    -- Determine notification type based on new status
    DECLARE
      notification_type TEXT;
    BEGIN
      IF NEW.status = 'sold' THEN
        notification_type := 'sold';
      ELSE
        notification_type := 'status_change';
      END IF;
      
      RAISE LOG 'Calling Edge Function with notification_type: %', notification_type;
      
      -- Call Edge Function for notification
      -- Edge Function will update last_notification_sent_at after successful send
      PERFORM
        net.http_post(
          url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/send-telegram-notification',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
          body:=json_build_object('productId', NEW.id, 'notificationType', notification_type)::jsonb
        );
        
      RAISE LOG 'Edge Function call completed for product %', NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'Error calling Edge Function for product %: %', NEW.id, SQLERRM;
      -- Don't fail the transaction, just log the error
    END;
  END IF;
  
  RETURN NEW;
END;
$$;