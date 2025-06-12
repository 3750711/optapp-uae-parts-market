
-- Создаем безопасную функцию для проверки админских прав без циклических зависимостей
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  );
$$;

-- Удаляем существующие проблематичные политики для profiles
DROP POLICY IF EXISTS "Profile access" ON public.profiles;
DROP POLICY IF EXISTS "Profile creation" ON public.profiles;

-- Создаем новые упрощенные политики для profiles
CREATE POLICY "Users can view profiles" ON public.profiles
FOR SELECT USING (
  -- Администраторы могут видеть все профили
  public.is_admin_user() OR
  -- Пользователи могут видеть только свой профиль
  id = auth.uid()
);

CREATE POLICY "Users can update profiles" ON public.profiles
FOR UPDATE USING (
  -- Администраторы могут обновлять все профили
  public.is_admin_user() OR
  -- Пользователи могут обновлять только свой профиль
  id = auth.uid()
);

CREATE POLICY "Users can insert profiles" ON public.profiles
FOR INSERT WITH CHECK (
  -- Новые профили создаются только для текущего пользователя
  id = auth.uid() OR
  -- Или администратором
  public.is_admin_user()
);

-- Обновляем политики для products с использованием новой функции
DROP POLICY IF EXISTS "Admin and seller product access" ON public.products;
DROP POLICY IF EXISTS "Users can create own products" ON public.products;

CREATE POLICY "Product access policy" ON public.products
FOR ALL USING (
  -- Администраторы могут управлять всеми товарами
  public.is_admin_user() OR
  -- Продавцы могут управлять только своими товарами
  seller_id = auth.uid() OR
  -- Публичный доступ к активным и проданным товарам только для чтения
  (status IN ('active', 'sold') AND current_setting('request.method', true) = 'GET')
);

CREATE POLICY "Product insert policy" ON public.products
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- Администраторы могут создавать товары от имени любого пользователя
    public.is_admin_user() OR
    -- Продавцы могут создавать только свои товары
    seller_id = auth.uid()
  )
);
