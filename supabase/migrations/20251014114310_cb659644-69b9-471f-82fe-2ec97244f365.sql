-- Добавляем поле target_audience в таблицу help_categories
ALTER TABLE public.help_categories 
ADD COLUMN target_audience TEXT NOT NULL DEFAULT 'all';

-- Добавляем проверку на допустимые значения
ALTER TABLE public.help_categories 
ADD CONSTRAINT help_categories_target_audience_check 
CHECK (target_audience IN ('all', 'buyer', 'seller'));

-- Обновляем существующие категории на основе их названий
-- Категории только для покупателей
UPDATE public.help_categories 
SET target_audience = 'buyer' 
WHERE title ILIKE '%покупк%' OR title ILIKE '%заказ%';

-- Категории только для продавцов
UPDATE public.help_categories 
SET target_audience = 'seller' 
WHERE title ILIKE '%продаж%' OR title ILIKE '%продав%';

-- Остальные категории остаются 'all' (по умолчанию)