
-- Очистка и исправление RLS политик для таблиц orders и order_videos
-- Удаляем все существующие конфликтующие политики

-- Удаляем все существующие политики для orders
DROP POLICY IF EXISTS "Centralized orders access policy" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Orders access policy" ON public.orders;
DROP POLICY IF EXISTS "Users can create orders for themselves" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;

-- Удаляем все существующие политики для order_videos
DROP POLICY IF EXISTS "order_videos_policy" ON public.order_videos;
DROP POLICY IF EXISTS "Users can manage order videos" ON public.order_videos;
DROP POLICY IF EXISTS "Admins can manage all order videos" ON public.order_videos;

-- Создаем недостающую функцию is_admin как алиас для is_current_user_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.is_current_user_admin();
END;
$$;

-- Создаем простые и понятные политики для orders
CREATE POLICY "orders_admin_full_access" ON public.orders
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "orders_user_access" ON public.orders
FOR ALL
USING (
  NOT public.is_admin() AND (
    auth.uid() = buyer_id OR 
    auth.uid() = seller_id
  )
)
WITH CHECK (
  NOT public.is_admin() AND (
    auth.uid() = buyer_id OR 
    auth.uid() = seller_id
  )
);

-- Создаем простые политики для order_videos
CREATE POLICY "order_videos_admin_access" ON public.order_videos
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "order_videos_user_access" ON public.order_videos
FOR ALL
USING (
  NOT public.is_admin() AND EXISTS (
    SELECT 1 FROM public.orders 
    WHERE id = order_id 
    AND (buyer_id = auth.uid() OR seller_id = auth.uid())
  )
)
WITH CHECK (
  NOT public.is_admin() AND EXISTS (
    SELECT 1 FROM public.orders 
    WHERE id = order_id 
    AND (buyer_id = auth.uid() OR seller_id = auth.uid())
  )
);
