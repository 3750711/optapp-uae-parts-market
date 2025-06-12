
-- Создаем RLS политики для таблицы products

-- Включаем RLS на таблице products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Политика для админов - полный доступ ко всем товарам
CREATE POLICY "Admins can manage all products" ON public.products
FOR ALL USING (
  public.is_current_user_admin()
);

-- Политика для продавцов - доступ к своим товарам
CREATE POLICY "Sellers can manage own products" ON public.products
FOR ALL USING (
  seller_id = public.current_user_id()
);

-- Политика для публичного просмотра активных товаров
CREATE POLICY "Public can view active products" ON public.products
FOR SELECT USING (
  status = 'active' OR 
  status = 'sold' OR
  public.is_current_user_admin() OR
  seller_id = public.current_user_id()
);

-- Политики для product_images
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view product images" ON public.product_images
FOR SELECT USING (true);

CREATE POLICY "Product owners can manage images" ON public.product_images
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.products 
    WHERE id = product_id 
    AND (seller_id = public.current_user_id() OR public.is_current_user_admin())
  )
);
