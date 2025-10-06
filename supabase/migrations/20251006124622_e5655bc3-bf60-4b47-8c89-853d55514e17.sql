-- Fix the notify_on_order_product_status_changes function
-- to properly update product status to 'sold' when order is created

CREATE OR REPLACE FUNCTION public.notify_on_order_product_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only when creating an order with a product
  IF NEW.product_id IS NOT NULL AND TG_OP = 'INSERT' THEN
    -- Combine both updates in a single query to avoid conflicts
    UPDATE public.products
    SET 
      status = 'sold',
      last_notification_sent_at = NULL
    WHERE id = NEW.product_id 
      AND status = 'active';  -- Explicitly target active products only
      
    -- Log for debugging
    RAISE NOTICE 'Order % created, product % status updated to sold', NEW.order_number, NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$;