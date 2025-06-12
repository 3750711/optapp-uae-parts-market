
-- Сначала удаляем все существующие политики для таблицы products
DROP POLICY IF EXISTS "Public view active products" ON public.products;
DROP POLICY IF EXISTS "Sellers manage own products" ON public.products;
DROP POLICY IF EXISTS "Auth users create products" ON public.products;
DROP POLICY IF EXISTS "Users can view products" ON public.products;
DROP POLICY IF EXISTS "Users can create products" ON public.products;
DROP POLICY IF EXISTS "Users can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;

-- Создаем простую и четкую политику для админов и владельцев товаров
CREATE POLICY "Admin and seller product access" ON public.products
FOR ALL USING (
  -- Администраторы могут видеть все товары
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) OR
  -- Продавцы могут видеть только свои товары
  seller_id = auth.uid() OR
  -- Публичный доступ к активным и проданным товарам для чтения
  (status IN ('active', 'sold') AND auth.role() = 'anon')
);

-- Политика для вставки товаров
CREATE POLICY "Users can create own products" ON public.products
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- Администраторы могут создавать товары от имени любого пользователя
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    ) OR
    -- Продавцы могут создавать только свои товары
    seller_id = auth.uid()
  )
);

-- Упрощаем политики для таблицы profiles
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "System insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Создаем простые политики для profiles
CREATE POLICY "Profile access" ON public.profiles
FOR ALL USING (
  -- Администраторы видят все профили
  EXISTS (
    SELECT 1 FROM public.profiles p2
    WHERE p2.id = auth.uid() 
    AND p2.user_type = 'admin'
  ) OR
  -- Пользователи видят только свой профиль
  id = auth.uid()
);

CREATE POLICY "Profile creation" ON public.profiles
FOR INSERT WITH CHECK (
  -- Только для собственного профиля или администратором
  id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )
);

-- Обновляем функцию для проверки админских прав (делаем её более надежной)
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT user_type = 'admin' 
     FROM public.profiles 
     WHERE id = auth.uid()),
    false
  );
$$;
