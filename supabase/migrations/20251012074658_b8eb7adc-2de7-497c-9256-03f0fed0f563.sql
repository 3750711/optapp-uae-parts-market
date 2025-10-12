-- ============================================
-- Миграция: Публичные магазины без токенов
-- Анонимы видят БЕЗ цен, Авторизованные - С ценами
-- ============================================

-- ВАЖНО: Система токенов для PROFILES НЕ ЗАТРОНУТА!

-- ============================================
-- ЧАСТЬ 1: СОЗДАНИЕ VIEW ДЛЯ БЕЗОПАСНОГО ДОСТУПА
-- ============================================

-- VIEW для публичных магазинов (без контактов продавца)
CREATE OR REPLACE VIEW public.stores_public AS
SELECT 
    id, name, description, address, location, tags, 
    verified, rating, reviews_count, created_at, 
    updated_at, seller_id
FROM public.stores;

-- VIEW для анонимов (БЕЗ цен)
CREATE OR REPLACE VIEW public.products_public AS
SELECT 
    id, title, brand, model, condition, description,
    lot_number, product_location, preview_image_url,
    view_count, rating_seller, status, place_number,
    created_at, updated_at, catalog_position, seller_id
FROM public.products
WHERE status = 'active';

-- VIEW для авторизованных (С ценами)
CREATE OR REPLACE VIEW public.products_for_buyers AS
SELECT 
    id, title, brand, model, condition, description,
    lot_number, product_location, preview_image_url,
    view_count, rating_seller, status, place_number,
    created_at, updated_at, catalog_position, seller_id,
    price, delivery_price
FROM public.products
WHERE status = 'active';

-- Настройка VIEW (security_invoker для использования прав вызывающего пользователя)
ALTER VIEW public.stores_public SET (security_invoker = true);
ALTER VIEW public.products_public SET (security_invoker = true);
ALTER VIEW public.products_for_buyers SET (security_invoker = true);

-- Права доступа
GRANT SELECT ON public.stores_public TO anon, authenticated;
GRANT SELECT ON public.products_public TO anon;
GRANT SELECT ON public.products_for_buyers TO authenticated;

-- ============================================
-- ЧАСТЬ 2: УДАЛЕНИЕ СИСТЕМЫ ТОКЕНОВ ДЛЯ STORES
-- ============================================

-- Удалить RPC функции для токенов stores
DROP FUNCTION IF EXISTS public.regenerate_store_share_token(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.disable_store_public_access(uuid) CASCADE;

-- Удалить индекс токенов
DROP INDEX IF EXISTS public.idx_stores_public_share_token;

-- ============================================
-- ЧАСТЬ 3: ОБНОВЛЕНИЕ RLS ПОЛИТИК
-- ============================================

-- Удалить старые токен-based политики для stores
DROP POLICY IF EXISTS "Enable public access to stores via token" ON public.stores;
DROP POLICY IF EXISTS "Enable public access to products via store token" ON public.products;
DROP POLICY IF EXISTS "Enable public access to product images via store token" ON public.product_images;

-- Удалить старые публичные политики (если есть)
DROP POLICY IF EXISTS "Public view stores" ON public.stores;
DROP POLICY IF EXISTS "Public view active products" ON public.products;
DROP POLICY IF EXISTS "Public view product images" ON public.product_images;
DROP POLICY IF EXISTS "Public view product videos" ON public.product_videos;

-- Закрыть прямой доступ к таблицам для анонимов (они используют VIEW)
CREATE POLICY "Authenticated view stores" ON public.stores
FOR SELECT TO authenticated
USING (
    seller_id = auth.uid() 
    OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND user_type IN ('admin', 'buyer')
    )
);

CREATE POLICY "Authenticated view products" ON public.products
FOR SELECT TO authenticated
USING (
    seller_id = auth.uid() 
    OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND user_type IN ('admin', 'buyer')
    )
);

-- Создать security definer функцию для проверки статуса товара
-- (избегаем рекурсивных проверок RLS в политиках)
CREATE OR REPLACE FUNCTION public.is_product_active(p_product_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.products 
    WHERE id = p_product_id 
    AND status = 'active'
  );
$$;

-- Публичные политики для изображений и видео (анонимы видят только активные товары)
CREATE POLICY "Public view active product images" ON public.product_images
FOR SELECT TO anon, authenticated
USING (public.is_product_active(product_id));

CREATE POLICY "Public view active product videos" ON public.product_videos
FOR SELECT TO anon, authenticated
USING (public.is_product_active(product_id));

-- ============================================
-- ЧАСТЬ 4: УДАЛЕНИЕ ПОЛЕЙ ТОКЕНОВ ИЗ STORES
-- ============================================

ALTER TABLE public.stores 
    DROP COLUMN IF EXISTS public_share_token,
    DROP COLUMN IF EXISTS public_share_enabled,
    DROP COLUMN IF EXISTS public_share_created_at,
    DROP COLUMN IF EXISTS public_share_expires_at;

-- ============================================
-- ЧАСТЬ 5: КОММЕНТАРИИ
-- ============================================

COMMENT ON VIEW public.stores_public IS 
'Public stores view - hides phone, telegram, owner_name. Anonymous access.';

COMMENT ON VIEW public.products_public IS 
'Anonymous products view - hides price, delivery_price. For anon users.';

COMMENT ON VIEW public.products_for_buyers IS 
'Authenticated products view - includes price, delivery_price. For logged-in users.';

COMMENT ON FUNCTION public.is_product_active IS
'Security definer function to check product active status without RLS recursion';

-- ============================================
-- ИНСТРУКЦИИ ПО ОТКАТУ МИГРАЦИИ
-- ============================================

/*
===============================================
КАК ОТКАТИТЬ ЭТУ МИГРАЦИЮ:
===============================================

-- 1. ВОССТАНОВИТЬ ПОЛЯ ТОКЕНОВ В STORES:
ALTER TABLE public.stores 
    ADD COLUMN IF NOT EXISTS public_share_token uuid,
    ADD COLUMN IF NOT EXISTS public_share_enabled boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS public_share_created_at timestamp with time zone,
    ADD COLUMN IF NOT EXISTS public_share_expires_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_stores_public_share_token ON public.stores(public_share_token);

-- 2. ВОССТАНОВИТЬ RPC ФУНКЦИИ (нужен код из старой миграции)
-- CREATE OR REPLACE FUNCTION public.regenerate_store_share_token(p_store_id uuid) ...
-- CREATE OR REPLACE FUNCTION public.disable_store_public_access(p_store_id uuid) ...

-- 3. УДАЛИТЬ НОВЫЕ RLS ПОЛИТИКИ:
DROP POLICY IF EXISTS "Authenticated view stores" ON public.stores;
DROP POLICY IF EXISTS "Authenticated view products" ON public.products;
DROP POLICY IF EXISTS "Public view active product images" ON public.product_images;
DROP POLICY IF EXISTS "Public view active product videos" ON public.product_videos;

-- 4. ВОССТАНОВИТЬ СТАРЫЕ ТОКЕН-BASED ПОЛИТИКИ (нужен код из старой миграции)
-- CREATE POLICY "Enable public access to stores via token" ON public.stores ...
-- CREATE POLICY "Enable public access to products via store token" ON public.products ...

-- 5. УДАЛИТЬ VIEW:
DROP VIEW IF EXISTS public.stores_public CASCADE;
DROP VIEW IF EXISTS public.products_public CASCADE;
DROP VIEW IF EXISTS public.products_for_buyers CASCADE;

-- 6. УДАЛИТЬ ФУНКЦИЮ:
DROP FUNCTION IF EXISTS public.is_product_active(uuid);

-- 7. ВОССТАНОВИТЬ ПУБЛИЧНЫЕ ПОЛИТИКИ:
-- CREATE POLICY "Public view stores" ON public.stores FOR SELECT USING (true);
-- CREATE POLICY "Public view active products" ON public.products FOR SELECT USING (status = 'active');

===============================================
*/