-- Add trigger to handle notifications for newly created products with active status
-- This complements the existing UPDATE trigger

CREATE TRIGGER trigger_notify_on_new_product
AFTER INSERT ON public.products
FOR EACH ROW
WHEN (NEW.status = 'active')
EXECUTE FUNCTION public.notify_on_product_status_changes();