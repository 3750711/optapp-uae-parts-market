
-- Create a trigger function that fires when a product status is updated to 'active'
CREATE OR REPLACE FUNCTION public.notify_on_status_change_to_active()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only trigger notification when status changes from non-active to active
  IF OLD.status != 'active' AND NEW.status = 'active' THEN
    -- Call the Supabase Edge Function to send notification
    -- This is done asynchronously via pg_net extension
    PERFORM
      net.http_post(
        url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/send-telegram-notification',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
        body:=json_build_object('productId', NEW.id)::jsonb
      );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create a trigger on the products table for the notify_on_status_change_to_active function
CREATE TRIGGER trigger_notify_on_status_change_to_active
AFTER UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_status_change_to_active();
