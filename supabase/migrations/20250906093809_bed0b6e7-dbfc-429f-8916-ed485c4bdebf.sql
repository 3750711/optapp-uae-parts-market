-- Remove duplicate notification trigger to prevent double notifications
-- The trigger_notify_registered_order_status already handles all order notifications

-- Drop the duplicate trigger
DROP TRIGGER IF EXISTS trigger_notify_seller_product_sold ON public.orders;

-- Drop the associated function since it's no longer needed
DROP FUNCTION IF EXISTS public.notify_seller_product_sold() CASCADE;

-- Log the removal
DO $$
BEGIN
  RAISE LOG 'Removed duplicate trigger trigger_notify_seller_product_sold and function notify_seller_product_sold to prevent double notifications';
END $$;