-- Fix the notify_seller_product_sold trigger function
-- Remove the invalid 'sold' status check for orders since 'sold' is not a valid order_status

CREATE OR REPLACE FUNCTION public.notify_seller_product_sold()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Only notify when creating an order with a product_id
  -- Remove the invalid status = 'sold' check since orders don't have 'sold' status
  IF NEW.product_id IS NOT NULL AND TG_OP = 'INSERT' THEN
    -- Send notification via Edge Function
    BEGIN
      PERFORM
        net.http_post(
          url := public.functions_url('notify-seller-product-sold'),
          headers := '{"Content-Type": "application/json"}'::jsonb,
          body := jsonb_build_object(
            'orderId', NEW.id,
            'productId', NEW.product_id,
            'buyerId', NEW.buyer_id,
            'sellerId', NEW.seller_id,
            'orderNumber', NEW.order_number,
            'title', NEW.title,
            'price', NEW.price
          )
        );
      RAISE LOG 'Product sold notification sent for order % and product %', NEW.id, NEW.product_id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Error sending product sold notification: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;