
-- Добавляем полнотекстовый поиск для профилей
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fts tsvector 
GENERATED ALWAYS AS (
  setweight(to_tsvector('russian', coalesce(full_name, '')), 'A') ||
  setweight(to_tsvector('russian', coalesce(email, '')), 'B') ||
  setweight(to_tsvector('russian', coalesce(opt_id, '')), 'A') ||
  setweight(to_tsvector('russian', coalesce(company_name, '')), 'C') ||
  setweight(to_tsvector('russian', coalesce(phone, '')), 'D') ||
  setweight(to_tsvector('russian', coalesce(telegram, '')), 'D')
) STORED;

-- Создаем GIN индекс для полнотекстового поиска
CREATE INDEX IF NOT EXISTS idx_profiles_fts ON public.profiles USING GIN (fts);

-- Улучшенные индексы для быстрой фильтрации и сортировки
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles (verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles (user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_opt_status ON public.profiles (opt_status);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at_desc ON public.profiles (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_rating ON public.profiles (rating) WHERE rating IS NOT NULL;

-- Составной индекс для часто используемых фильтров
CREATE INDEX IF NOT EXISTS idx_profiles_status_type_created ON public.profiles (verification_status, user_type, created_at DESC);

-- Удаляем возможные дублирующиеся RLS политики (если есть)
DROP POLICY IF EXISTS "Users can view their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public view active products basic" ON public.products;

-- Восстанавливаем минимальные необходимые RLS политики
CREATE POLICY "Users view own and public profiles" ON public.profiles
FOR SELECT USING (
  id = public.current_user_id() OR 
  public.is_current_user_admin() OR
  verification_status = 'verified'
);

CREATE POLICY "Users update own profile or admin" ON public.profiles
FOR UPDATE USING (
  id = public.current_user_id() OR 
  public.is_current_user_admin()
);

-- Функция для rate limiting поиска
CREATE OR REPLACE FUNCTION public.check_search_rate_limit(p_user_id uuid, p_search_type text DEFAULT 'general')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  recent_searches integer;
BEGIN
  -- Проверяем количество поисковых запросов за последние 5 минут
  SELECT COUNT(*) INTO recent_searches
  FROM public.login_attempts
  WHERE identifier = p_user_id::text
    AND attempt_type = p_search_type
    AND created_at > NOW() - INTERVAL '5 minutes';
  
  -- Лимит: 100 поисковых запросов за 5 минут
  IF recent_searches >= 100 THEN
    -- Логируем превышение лимита
    INSERT INTO public.login_attempts (identifier, attempt_type, success, error_message)
    VALUES (p_user_id::text, p_search_type, false, 'Search rate limit exceeded');
    
    RETURN false;
  END IF;
  
  -- Логируем успешный поиск
  INSERT INTO public.login_attempts (identifier, attempt_type, success)
  VALUES (p_user_id::text, p_search_type, true);
  
  RETURN true;
END;
$$;
