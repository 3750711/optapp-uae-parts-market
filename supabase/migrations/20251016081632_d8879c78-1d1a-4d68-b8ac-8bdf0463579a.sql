-- Удаление лишних триггеров на таблице products
-- Оставляем только trigger_notify_on_product_status_changes

-- Удаляем старые триггеры которые дублируют функциональность
DROP TRIGGER IF EXISTS trigger_notify_on_product_insert_active ON public.products;
DROP TRIGGER IF EXISTS trigger_notify_on_product_update_to_active ON public.products;

-- Проверяем что остался только один триггер: trigger_notify_on_product_status_changes
-- Он уже настроен правильно как AFTER INSERT OR UPDATE и вызывает notify_on_product_status_changes()