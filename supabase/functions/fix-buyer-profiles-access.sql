
-- Добавляем политику для доступа продавцов к профилям покупателей
CREATE POLICY "Sellers can view buyer profiles for orders" ON public.profiles
FOR SELECT USING (
  -- Продавцы могут видеть профили покупателей
  (user_type = 'buyer' AND EXISTS (
    SELECT 1 FROM public.profiles seller_profile 
    WHERE seller_profile.id = auth.uid() 
    AND seller_profile.user_type = 'seller'
  )) OR
  -- Пользователи видят свой профиль
  id = auth.uid() OR
  -- Администраторы видят все профили
  EXISTS (
    SELECT 1 FROM public.profiles admin_profile 
    WHERE admin_profile.id = auth.uid() 
    AND admin_profile.user_type = 'admin'
  )
);

-- Также добавляем общую политику для публичного просмотра базовой информации о покупателях
CREATE POLICY "Public view buyer basic info" ON public.profiles
FOR SELECT USING (
  user_type = 'buyer' AND opt_id IS NOT NULL
);
