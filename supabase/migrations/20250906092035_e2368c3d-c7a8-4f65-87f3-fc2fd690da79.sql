-- Fix notification data format for Edge Function compatibility
-- The Edge Function expects {order: {...}, action: "create"} format but we were sending flat data

CREATE OR REPLACE FUNCTION public.notify_registered_order_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Notify on INSERT (new order creation) OR UPDATE with status change
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Send notification via Edge Function using correct data format
    BEGIN
      PERFORM
        net.http_post(
          url := public.functions_url('send-telegram-notification'),
          headers := '{"Content-Type": "application/json"}'::jsonb,
          body := jsonb_build_object(
            'order', jsonb_build_object(
              'id', NEW.id,
              'order_number', NEW.order_number,
              'title', NEW.title,
              'price', NEW.price,
              'status', NEW.status,
              'buyer_id', NEW.buyer_id,
              'seller_id', NEW.seller_id,
              'brand', NEW.brand,
              'model', NEW.model,
              'created_at', NEW.created_at,
              'order_created_type', NEW.order_created_type,
              'delivery_method', NEW.delivery_method,
              'place_number', NEW.place_number
            ),
            'action', CASE 
              WHEN TG_OP = 'INSERT' THEN 'create'
              ELSE 'status_change'
            END
          )
        );
      RAISE LOG 'Order notification sent for order % (action: %)', NEW.id, CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'status_change' END;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Error sending order notification for order %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;