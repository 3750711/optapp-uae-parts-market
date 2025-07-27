-- Убираем старый триггер если есть и создаем новый
DROP TRIGGER IF EXISTS trigger_notify_on_product_status_changes ON public.products;

-- Создаем триггер для уведомлений о статусе продуктов
CREATE TRIGGER trigger_notify_on_product_status_changes
AFTER UPDATE OF status ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_product_status_changes();