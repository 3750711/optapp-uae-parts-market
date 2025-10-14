-- Удаляем старый триггер
DROP TRIGGER IF EXISTS trigger_notify_on_product_status_changes ON public.products;

-- Создаём триггер для INSERT (срабатывает только при статусе 'active')
CREATE TRIGGER trigger_notify_on_product_insert_active
AFTER INSERT ON public.products
FOR EACH ROW
WHEN (NEW.status = 'active')
EXECUTE FUNCTION public.notify_on_product_status_changes();

-- Создаём триггер для UPDATE (срабатывает только при изменении статуса на 'active')
CREATE TRIGGER trigger_notify_on_product_update_to_active
AFTER UPDATE ON public.products
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'active')
EXECUTE FUNCTION public.notify_on_product_status_changes();