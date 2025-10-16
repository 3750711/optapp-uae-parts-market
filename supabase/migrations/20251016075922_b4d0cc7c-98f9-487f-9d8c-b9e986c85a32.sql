-- Fix duplicate notifications: add WHEN clause to trigger
-- This prevents trigger from firing when only last_notification_sent_at changes

DROP TRIGGER IF EXISTS trigger_notify_on_product_status_changes ON public.products;

-- Re-create trigger with WHEN clause to fire ONLY when status changes
CREATE TRIGGER trigger_notify_on_product_status_changes
AFTER UPDATE ON public.products
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.notify_on_product_status_changes();