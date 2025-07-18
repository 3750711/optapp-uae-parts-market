-- Create function to send new order notifications for all order types
CREATE OR REPLACE FUNCTION public.notify_on_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Send notification for new order via Edge Function
  -- This will send the same format notification as free orders with photos
  PERFORM
    net.http_post(
      url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/send-telegram-notification',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
      body:=json_build_object(
        'order', row_to_json(NEW),
        'action', 'create'
      )::jsonb
    );
  
  RETURN NEW;
END;
$$;

-- Create trigger to fire after order insertion
-- This will ensure all order types (free_order, product_order, price_offer_order) 
-- send new order notifications in the same format with photos
CREATE TRIGGER trigger_notify_on_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_new_order();