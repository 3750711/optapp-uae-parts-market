-- Удаляем старый триггер который дублирует уведомления для registered orders
DROP TRIGGER IF EXISTS order_status_notification_trigger ON public.orders;

-- Удаляем функцию которая больше не нужна
DROP FUNCTION IF EXISTS public.notify_on_order_status_changes() CASCADE;