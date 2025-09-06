-- Отключить только пользовательские триггеры на таблице orders
-- Системные триггеры (RI_ConstraintTrigger) трогать нельзя

-- Сначала посмотрим все триггеры
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    RAISE LOG 'Current triggers on orders table:';
    FOR trigger_record IN 
        SELECT tgname, tgenabled, tgtype
        FROM pg_trigger 
        WHERE tgrelid = 'public.orders'::regclass
          AND NOT tgisinternal  -- Исключаем внутренние системные триггеры
    LOOP
        RAISE LOG 'Trigger: % - enabled: % - type: %', trigger_record.tgname, trigger_record.tgenabled, trigger_record.tgtype;
    END LOOP;
END $$;

-- Отключаем конкретные пользовательские триггеры (не системные)
-- Ищем триггеры, которые могут влиять на создание orders
DROP TRIGGER IF EXISTS trigger_notify_on_order_creation ON public.orders;
DROP TRIGGER IF EXISTS trigger_notify_on_order_product_status_changes ON public.orders; 
DROP TRIGGER IF EXISTS trigger_set_order_buyer_info ON public.orders;
DROP TRIGGER IF EXISTS trigger_set_order_seller_info ON public.orders;
DROP TRIGGER IF EXISTS trigger_set_order_buyer_opt_id ON public.orders;
DROP TRIGGER IF EXISTS trigger_set_order_seller_name ON public.orders;

-- Логируем что отключили
RAISE LOG 'Disabled all user-defined triggers on orders table for testing';