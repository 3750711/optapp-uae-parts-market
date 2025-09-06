-- Fix registered order notification trigger to send correct action type
-- When order status changes to 'processed', send action 'registered' to route to correct Telegram group

CREATE OR REPLACE FUNCTION public.notify_registered_order_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Notify on INSERT (new order creation) OR UPDATE with status change
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Send notification via Edge Function using correct data format with all fields
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
              'place_number', NEW.place_number,
              'images', NEW.images,
              'video_url', NEW.video_url,
              'telegram_url_order', NEW.telegram_url_order,
              'text_order', NEW.text_order,
              'delivery_price_confirm', NEW.delivery_price_confirm,
              'seller_opt_id', NEW.seller_opt_id,
              'buyer_opt_id', NEW.buyer_opt_id,
              'telegram_url_buyer', NEW.telegram_url_buyer,
              'order_seller_name', NEW.order_seller_name
            ),
            'action', CASE 
              WHEN TG_OP = 'INSERT' THEN 'create'
              WHEN TG_OP = 'UPDATE' AND NEW.status = 'processed' THEN 'registered'
              ELSE 'status_change'
            END
          )
        );
      RAISE LOG 'Order notification sent for order % (action: %) with % images', NEW.id, 
        CASE 
          WHEN TG_OP = 'INSERT' THEN 'create'
          WHEN TG_OP = 'UPDATE' AND NEW.status = 'processed' THEN 'registered'
          ELSE 'status_change'
        END, 
        COALESCE(array_length(NEW.images, 1), 0);
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Error sending order notification for order %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;