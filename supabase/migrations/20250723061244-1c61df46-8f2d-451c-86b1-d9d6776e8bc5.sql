-- Create function to trigger Pusher notifications for price offers
CREATE OR REPLACE FUNCTION public.notify_pusher_price_offer_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call the pusher-trigger Edge Function
  PERFORM
    net.http_post(
      url := 'https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/pusher-trigger',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
      body := jsonb_build_object(
        'channel', 'product-' || COALESCE(NEW.product_id, OLD.product_id),
        'event', CASE 
          WHEN TG_OP = 'INSERT' THEN 'offer-created'
          WHEN TG_OP = 'UPDATE' THEN 'offer-updated' 
          WHEN TG_OP = 'DELETE' THEN 'offer-deleted'
        END,
        'data', CASE 
          WHEN TG_OP = 'DELETE' THEN jsonb_build_object(
            'id', OLD.id,
            'product_id', OLD.product_id,
            'buyer_id', OLD.buyer_id,
            'seller_id', OLD.seller_id,
            'offered_price', OLD.offered_price,
            'status', OLD.status,
            'created_at', OLD.created_at,
            'updated_at', OLD.updated_at,
            'action', 'deleted'
          )
          ELSE jsonb_build_object(
            'id', NEW.id,
            'product_id', NEW.product_id,
            'buyer_id', NEW.buyer_id,
            'seller_id', NEW.seller_id,
            'offered_price', NEW.offered_price,
            'status', NEW.status,
            'created_at', NEW.created_at,
            'updated_at', NEW.updated_at,
            'action', CASE 
              WHEN TG_OP = 'INSERT' THEN 'created'
              ELSE 'updated'
            END
          )
        END
      )
    );

  -- Also notify buyer's personal channel
  PERFORM
    net.http_post(
      url := 'https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/pusher-trigger',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
      body := jsonb_build_object(
        'channel', 'buyer-' || COALESCE(NEW.buyer_id, OLD.buyer_id),
        'event', CASE 
          WHEN TG_OP = 'INSERT' THEN 'offer-created'
          WHEN TG_OP = 'UPDATE' THEN 'offer-updated'
          WHEN TG_OP = 'DELETE' THEN 'offer-deleted'
        END,
        'data', CASE 
          WHEN TG_OP = 'DELETE' THEN jsonb_build_object(
            'id', OLD.id,
            'product_id', OLD.product_id,
            'buyer_id', OLD.buyer_id,
            'seller_id', OLD.seller_id,
            'offered_price', OLD.offered_price,
            'status', OLD.status,
            'created_at', OLD.created_at,
            'updated_at', OLD.updated_at,
            'action', 'deleted'
          )
          ELSE jsonb_build_object(
            'id', NEW.id,
            'product_id', NEW.product_id,
            'buyer_id', NEW.buyer_id,
            'seller_id', NEW.seller_id,
            'offered_price', NEW.offered_price,
            'status', NEW.status,
            'created_at', NEW.created_at,
            'updated_at', NEW.updated_at,
            'action', CASE 
              WHEN TG_OP = 'INSERT' THEN 'created'
              ELSE 'updated'
            END
          )
        END
      )
    );

  -- Return appropriate record
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create triggers for price offers
DROP TRIGGER IF EXISTS trigger_pusher_price_offer_insert ON public.price_offers;
DROP TRIGGER IF EXISTS trigger_pusher_price_offer_update ON public.price_offers;
DROP TRIGGER IF EXISTS trigger_pusher_price_offer_delete ON public.price_offers;

CREATE TRIGGER trigger_pusher_price_offer_insert
  AFTER INSERT ON public.price_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_pusher_price_offer_changes();

CREATE TRIGGER trigger_pusher_price_offer_update
  AFTER UPDATE ON public.price_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_pusher_price_offer_changes();

CREATE TRIGGER trigger_pusher_price_offer_delete
  AFTER DELETE ON public.price_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_pusher_price_offer_changes();