-- Шаг 1: Расширение таблицы stores для публичных ссылок
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS public_share_token UUID DEFAULT gen_random_uuid();
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS public_share_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS public_share_created_at TIMESTAMPTZ;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS public_share_expires_at TIMESTAMPTZ;

-- Индекс для быстрого поиска по токену
CREATE INDEX IF NOT EXISTS idx_stores_public_share_token ON public.stores(public_share_token) WHERE public_share_enabled = true;

-- Функция для генерации нового токена
CREATE OR REPLACE FUNCTION public.regenerate_store_share_token(store_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_token UUID;
    store_seller_id UUID;
BEGIN
    -- Получаем seller_id магазина
    SELECT seller_id INTO store_seller_id
    FROM public.stores 
    WHERE id = store_id;
    
    IF store_seller_id IS NULL THEN
        RAISE EXCEPTION 'Store not found';
    END IF;
    
    -- Проверяем права доступа (только владелец или админ)
    IF NOT (
        store_seller_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    -- Генерируем новый токен
    new_token := gen_random_uuid();
    
    -- Обновляем токен и временные метки
    UPDATE public.stores 
    SET 
        public_share_token = new_token,
        public_share_enabled = true,
        public_share_created_at = now(),
        public_share_expires_at = now() + interval '30 days'
    WHERE id = store_id;
    
    RETURN new_token;
END;
$$;

-- Функция для отключения публичного доступа
CREATE OR REPLACE FUNCTION public.disable_store_public_access(store_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    store_seller_id UUID;
BEGIN
    -- Получаем seller_id магазина
    SELECT seller_id INTO store_seller_id
    FROM public.stores 
    WHERE id = store_id;
    
    IF store_seller_id IS NULL THEN
        RAISE EXCEPTION 'Store not found';
    END IF;
    
    -- Проверяем права доступа (только владелец или админ)
    IF NOT (
        store_seller_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    
    -- Отключаем публичный доступ
    UPDATE public.stores 
    SET 
        public_share_enabled = false,
        public_share_expires_at = null
    WHERE id = store_id;
    
    RETURN TRUE;
END;
$$;

-- Таблица для логов публичного доступа
CREATE TABLE IF NOT EXISTS public.store_public_access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    accessed_at TIMESTAMPTZ DEFAULT now(),
    user_agent TEXT,
    referer TEXT,
    ip_address INET
);

-- Индекс для аналитики
CREATE INDEX IF NOT EXISTS idx_store_public_access_logs_store_id_date 
ON public.store_public_access_logs(store_id, accessed_at DESC);

-- Новые RLS политики для публичного доступа к магазинам
CREATE POLICY "Enable public access to stores via token" ON public.stores
FOR SELECT TO anon, authenticated
USING (
    public_share_enabled = true 
    AND public_share_expires_at > now()
    AND public_share_token = COALESCE(
        (current_setting('app.current_share_token', true))::uuid,
        NULL
    )
);

-- Политика для доступа к товарам через токен магазина
CREATE POLICY "Enable public access to products via store token" ON public.products
FOR SELECT TO anon, authenticated
USING (
    status = 'active'
    AND seller_id IN (
        SELECT seller_id FROM public.stores 
        WHERE public_share_enabled = true 
        AND public_share_expires_at > now()
        AND public_share_token = COALESCE(
            (current_setting('app.current_share_token', true))::uuid,
            NULL
        )
    )
);

-- Политика для доступа к изображениям товаров через токен
CREATE POLICY "Enable public access to product images via store token" ON public.product_images
FOR SELECT TO anon, authenticated
USING (
    product_id IN (
        SELECT p.id FROM public.products p
        JOIN public.stores s ON p.seller_id = s.seller_id
        WHERE p.status = 'active'
        AND s.public_share_enabled = true 
        AND s.public_share_expires_at > now()
        AND s.public_share_token = COALESCE(
            (current_setting('app.current_share_token', true))::uuid,
            NULL
        )
    )
);