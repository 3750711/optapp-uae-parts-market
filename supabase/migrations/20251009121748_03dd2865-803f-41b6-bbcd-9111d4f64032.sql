-- Удаляем триггер #4 который дублирует уведомления для статуса seller_confirmed
DROP TRIGGER IF EXISTS trigger_notify_on_seller_confirmation ON public.orders;

-- Удаляем функцию которая больше не нужна
DROP FUNCTION IF EXISTS public.notify_on_seller_confirmation() CASCADE;