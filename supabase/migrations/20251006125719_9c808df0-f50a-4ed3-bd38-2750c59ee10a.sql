-- Restore missing trigger for order product status changes
-- This trigger was removed in migration 20250906075639 and needs to be restored
-- It calls notify_on_order_product_status_changes() when a new order is created

CREATE TRIGGER trigger_notify_on_order_product_status_changes
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_order_product_status_changes();