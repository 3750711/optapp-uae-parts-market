
-- Удаляем все существующие политики для таблицы confirm_images
DROP POLICY IF EXISTS "Users can view confirm images" ON public.confirm_images;
DROP POLICY IF EXISTS "Users can insert confirm images" ON public.confirm_images;
DROP POLICY IF EXISTS "Users can delete confirm images" ON public.confirm_images;
DROP POLICY IF EXISTS "Admins can manage confirm images" ON public.confirm_images;
DROP POLICY IF EXISTS "Order participants can manage confirm images" ON public.confirm_images;

-- Включаем RLS для таблицы confirm_images, если еще не включено
ALTER TABLE public.confirm_images ENABLE ROW LEVEL SECURITY;

-- Создаем простые и понятные политики для confirm_images
-- Политика для просмотра: администраторы и участники заказа (покупатель/продавец)
CREATE POLICY "confirm_images_select_policy" ON public.confirm_images
FOR SELECT
USING (
  -- Администраторы могут видеть все
  public.is_admin() OR
  -- Участники заказа могут видеть подтверждающие фото
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id 
    AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
  )
);

-- Политика для вставки: администраторы и участники заказа
CREATE POLICY "confirm_images_insert_policy" ON public.confirm_images
FOR INSERT
WITH CHECK (
  -- Проверяем, что пользователь аутентифицирован
  auth.uid() IS NOT NULL AND (
    -- Администраторы могут добавлять любые фото
    public.is_admin() OR
    -- Участники заказа могут добавлять подтверждающие фото
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id 
      AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
    )
  )
);

-- Политика для удаления: администраторы и участники заказа
CREATE POLICY "confirm_images_delete_policy" ON public.confirm_images
FOR DELETE
USING (
  -- Администраторы могут удалять любые фото
  public.is_admin() OR
  -- Участники заказа могут удалять подтверждающие фото
  EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id 
    AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
  )
);
