-- Fix the create_price_offer_notification function
CREATE OR REPLACE FUNCTION public.create_price_offer_notification(p_buyer_id uuid, p_product_id uuid, p_offered_price numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Send notification via Edge Function
  BEGIN
    PERFORM
      net.http_post(
        url := public.functions_url('notify-seller-new-price-offer'),
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := jsonb_build_object(
          'buyerId', p_buyer_id,
          'productId', p_product_id,
          'offeredPrice', p_offered_price
        )
      );
    RAISE LOG 'Price offer notification sent for buyer % and product %', p_buyer_id, p_product_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Error sending price offer notification: %', SQLERRM;
  END;
END;
$function$;

-- Fix the notify_registered_order_status function  
CREATE OR REPLACE FUNCTION public.notify_registered_order_status(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Send notification via Edge Function
  BEGIN
    PERFORM
      net.http_post(
        url := public.functions_url('send-telegram-notification'),
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := jsonb_build_object(
          'orderId', p_order_id,
          'notificationType', 'order_status_change'
        )
      );
    RAISE LOG 'Order status notification sent for order %', p_order_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Error sending order status notification: %', SQLERRM;
  END;
END;
$function$;