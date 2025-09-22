-- Шаг 1: Расширение базы данных для AI-анализа доставки

-- Добавляем поля для AI-предложений доставки
ALTER TABLE public.products 
ADD COLUMN ai_suggested_delivery_prices jsonb DEFAULT '[]'::jsonb,
ADD COLUMN ai_delivery_confidence numeric(3,2) DEFAULT 0.0,
ADD COLUMN ai_delivery_reasoning jsonb DEFAULT '{}'::jsonb;

-- Добавляем индексы для производительности
CREATE INDEX idx_products_ai_delivery_confidence ON public.products(ai_delivery_confidence) WHERE ai_delivery_confidence > 0;
CREATE INDEX idx_products_delivery_price ON public.products(delivery_price) WHERE delivery_price IS NOT NULL;

-- Комментарии для документации
COMMENT ON COLUMN public.products.ai_suggested_delivery_prices IS 'Массив предложенных AI ценовых вариантов доставки';
COMMENT ON COLUMN public.products.ai_delivery_confidence IS 'Уровень уверенности AI в предложениях доставки (0.0-1.0)';
COMMENT ON COLUMN public.products.ai_delivery_reasoning IS 'Детальное обоснование логики расчёта доставки в JSON формате';