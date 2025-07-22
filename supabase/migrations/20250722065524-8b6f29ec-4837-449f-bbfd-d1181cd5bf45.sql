
-- Устанавливаем REPLICA IDENTITY FULL для корректной работы Realtime с UPDATE операциями
ALTER TABLE public.price_offers REPLICA IDENTITY FULL;

-- Проверяем что таблица уже добавлена в публикацию realtime (должна быть)
-- Если нет, раскомментируйте следующую строку:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.price_offers;
