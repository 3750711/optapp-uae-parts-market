-- Шаг 1: Добавляем поле tg_views_frozen для хранения просмотров на момент продажи
ALTER TABLE public.products 
ADD COLUMN tg_views_frozen INTEGER DEFAULT NULL;

-- Добавляем комментарий для ясности
COMMENT ON COLUMN public.products.tg_views_frozen IS 'Количество просмотров на момент смены статуса товара на sold';