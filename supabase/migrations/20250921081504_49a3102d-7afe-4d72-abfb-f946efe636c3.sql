-- Добавляем поля для публичного шаринга профилей продавцов
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS public_share_token UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS public_share_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS public_share_created_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS public_share_expires_at TIMESTAMPTZ DEFAULT now() + interval '1 year';

-- Создаем индекс для быстрого поиска по токену (без предиката времени)
CREATE INDEX IF NOT EXISTS idx_profiles_public_share_token 
ON public.profiles(public_share_token) 
WHERE public_share_enabled = true;

-- Обновляем существующих продавцов - генерируем токены для всех
UPDATE public.profiles 
SET 
  public_share_token = gen_random_uuid(),
  public_share_enabled = true,
  public_share_created_at = now(),
  public_share_expires_at = now() + interval '1 year'
WHERE user_type = 'seller' 
AND public_share_token IS NULL;

-- Функция для генерации нового токена
CREATE OR REPLACE FUNCTION public.regenerate_profile_share_token(p_profile_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token UUID;
BEGIN
  -- Проверяем, что пользователь может управлять этим профилем
  IF NOT (auth.uid() = p_profile_id OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Генерируем новый токен
  new_token := gen_random_uuid();
  
  -- Обновляем профиль
  UPDATE public.profiles
  SET 
    public_share_token = new_token,
    public_share_created_at = now(),
    public_share_expires_at = now() + interval '1 year'
  WHERE id = p_profile_id;
  
  RETURN new_token;
END;
$$;

-- Функция для отключения публичного доступа
CREATE OR REPLACE FUNCTION public.disable_profile_public_access(p_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Проверяем, что пользователь может управлять этим профилем
  IF NOT (auth.uid() = p_profile_id OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Отключаем публичный доступ
  UPDATE public.profiles
  SET 
    public_share_enabled = false
  WHERE id = p_profile_id;
  
  RETURN true;
END;
$$;