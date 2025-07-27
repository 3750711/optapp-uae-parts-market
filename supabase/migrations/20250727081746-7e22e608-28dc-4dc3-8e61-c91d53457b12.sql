-- Создаем отсутствующий триггер для уведомлений о статусе продуктов
CREATE TRIGGER trigger_notify_on_product_status_changes
AFTER UPDATE OF status ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_product_status_changes();