-- Create trigger function to notify seller about new order
CREATE OR REPLACE FUNCTION public.notify_seller_on_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only proceed for actual orders (not just INSERT operations from other functions)
  IF TG_OP = 'INSERT' AND NEW.seller_id IS NOT NULL THEN
    
    -- Check if seller has telegram_id in profiles
    IF EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = NEW.seller_id 
      AND telegram_id IS NOT NULL
    ) THEN
      
      -- Call the edge function to send notification
      BEGIN
        PERFORM
          net.http_post(
            url := public.functions_url('/functions/v1/notify-seller-product-sold'),
            headers := '{"Content-Type": "application/json"}'::jsonb,
            body := jsonb_build_object(
              'orderId', NEW.id,
              'sellerId', NEW.seller_id,
              'orderNumber', NEW.order_number,
              'buyerOptId', NEW.buyer_opt_id,
              'productId', NEW.product_id,
              'title', NEW.title,
              'price', NEW.price,
              'brand', NEW.brand,
              'model', NEW.model,
              'images', NEW.images
            )
          );
        
        RAISE LOG 'Notification sent for new order %', NEW.id;
        
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'Error sending notification for order %: %', NEW.id, SQLERRM;
      END;
    ELSE
      RAISE LOG 'Seller % has no telegram_id, skipping notification for order %', NEW.seller_id, NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on orders table
CREATE TRIGGER notify_seller_new_order_trigger
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_seller_on_new_order();