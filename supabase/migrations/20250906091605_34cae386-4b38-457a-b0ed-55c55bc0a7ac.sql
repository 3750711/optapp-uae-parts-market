-- Fix notification system for orders
-- This addresses the issue where order notifications weren't being sent for new orders (INSERT operations)

-- First, fix the notify_registered_order_status trigger function to handle both INSERT and UPDATE
CREATE OR REPLACE FUNCTION public.notify_registered_order_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Notify on INSERT (new order creation) OR UPDATE with status change
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Send notification via Edge Function using proper function URL
    BEGIN
      PERFORM
        net.http_post(
          url := public.functions_url('send-telegram-notification'),
          headers := '{"Content-Type": "application/json"}'::jsonb,
          body := jsonb_build_object(
            'orderId', NEW.id,
            'notificationType', CASE 
              WHEN TG_OP = 'INSERT' THEN 'order_created'
              ELSE 'order_status_change'
            END,
            'orderNumber', NEW.order_number,
            'status', NEW.status,
            'title', NEW.title,
            'price', NEW.price,
            'buyerId', NEW.buyer_id,
            'sellerId', NEW.seller_id
          )
        );
      RAISE LOG 'Order notification sent for order % (type: %)', NEW.id, CASE WHEN TG_OP = 'INSERT' THEN 'created' ELSE 'status_change' END;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Error sending order notification for order %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Remove the duplicate standalone notify_registered_order_status function if it exists
DROP FUNCTION IF EXISTS public.notify_registered_order_status(uuid);

-- Ensure the trigger exists and is properly configured
DROP TRIGGER IF EXISTS trigger_notify_registered_order_status ON public.orders;
CREATE TRIGGER trigger_notify_registered_order_status
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_registered_order_status();

-- Also ensure the notify_seller_product_sold trigger is properly configured
DROP TRIGGER IF EXISTS trigger_notify_seller_product_sold ON public.orders;
CREATE TRIGGER trigger_notify_seller_product_sold
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_seller_product_sold();