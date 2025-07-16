-- Этап 2: Очистка дублирующихся RLS политик для profiles
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile or admin" ON public.profiles;

-- Создаем единообразные политики
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile or admin access" 
ON public.profiles 
FOR UPDATE 
USING (id = auth.uid() OR is_current_user_admin());