-- Временно отключить все триггеры на таблице orders для диагностики
-- Сохраняем информацию о существующих триггерах для последующего восстановления

-- Отключаем все триггеры на таблице orders
ALTER TABLE public.orders DISABLE TRIGGER ALL;

-- Логируем отключенные триггеры
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT tgname, tgenabled 
        FROM pg_trigger 
        WHERE tgrelid = 'public.orders'::regclass
    LOOP
        RAISE LOG 'Trigger % on orders table - enabled: %', trigger_record.tgname, trigger_record.tgenabled;
    END LOOP;
END $$;

-- Комментарий для восстановления:
-- Для включения триггеров обратно используйте: ALTER TABLE public.orders ENABLE TRIGGER ALL;