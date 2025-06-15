
-- Включаем расширение pg_trgm для эффективного текстового поиска (похожего на ILIKE '%...%')
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Составной индекс для фильтрации по статусу, бренду и модели.
CREATE INDEX IF NOT EXISTS idx_products_status_brand_model ON public.products (status, brand, model);

-- GIN индекс для текстового поиска по названию товара.
CREATE INDEX IF NOT EXISTS idx_products_title_trgm ON public.products USING GIN (title gin_trgm_ops);

-- Индекс для быстрой сортировки по дате создания (сначала новые).
CREATE INDEX IF NOT EXISTS idx_products_created_at_desc ON public.products (created_at DESC);

-- Индекс для быстрой сортировки по цене (сначала дешевые).
CREATE INDEX IF NOT EXISTS idx_products_price_asc ON public.products (price ASC);
