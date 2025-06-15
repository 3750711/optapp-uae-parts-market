
-- Включаем расширение для текстового поиска, если оно еще не включено
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Удаляем все существующие политики для таблицы orders, чтобы избежать конфликтов
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Orders access policy" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders for themselves" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;

-- 2. Создаем единую политику доступа к заказам
-- Эта политика использует безопасную функцию is_admin() и проверяет ID покупателя/продавца
CREATE POLICY "Centralized orders access policy" ON public.orders
FOR ALL
USING (
  public.is_admin() OR (auth.uid() = buyer_id) OR (auth.uid() = seller_id)
)
WITH CHECK (
  public.is_admin() OR (auth.uid() = buyer_id) OR (auth.uid() = seller_id)
);

-- 3. Добавляем индексы для ускорения поиска и фильтрации
-- Индекс для быстрого поиска по номеру заказа
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- GIN индексы для ускорения текстового поиска (ILIKE) по нескольким полям
CREATE INDEX IF NOT EXISTS idx_orders_title_trgm ON public.orders USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_orders_brand_trgm ON public.orders USING gin (brand gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_orders_model_trgm ON public.orders USING gin (model gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_orders_text_order_trgm ON public.orders USING gin (text_order gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_opt_id_trgm ON public.orders USING gin (buyer_opt_id gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_orders_seller_opt_id_trgm ON public.orders USING gin (seller_opt_id gin_trgm_ops);

