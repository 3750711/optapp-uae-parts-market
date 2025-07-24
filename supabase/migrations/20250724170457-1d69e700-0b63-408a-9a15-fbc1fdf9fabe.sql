-- Create function to notify on seller confirmation
CREATE OR REPLACE FUNCTION public.notify_on_seller_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only send notification when status changes to seller_confirmed
  IF (TG_OP = 'UPDATE' AND 
      OLD.status != 'seller_confirmed' AND 
      NEW.status = 'seller_confirmed') THEN
    
    -- Update timestamp for tracking
    NEW.last_notification_sent_at := NOW();
    
    -- Call edge function to send Telegram notification
    PERFORM
      net.http_post(
        url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/send-telegram-notification',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
        body:=json_build_object(
          'orderId', NEW.id, 
          'action', 'status_change',
          'newStatus', 'seller_confirmed'
        )::jsonb
      );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for seller confirmation notifications
CREATE TRIGGER trigger_notify_on_seller_confirmation
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_seller_confirmation();