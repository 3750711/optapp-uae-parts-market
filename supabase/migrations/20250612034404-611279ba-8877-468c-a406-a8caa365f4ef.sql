
-- Создаем индексы для оптимизации поиска по пользователям в админ панели
CREATE INDEX IF NOT EXISTS idx_profiles_search ON public.profiles USING gin(
  to_tsvector('russian', 
    COALESCE(full_name, '') || ' ' || 
    COALESCE(email, '') || ' ' || 
    COALESCE(company_name, '') || ' ' || 
    COALESCE(opt_id, '') || ' ' || 
    COALESCE(phone, '') || ' ' || 
    COALESCE(telegram, '')
  )
);

-- Индексы для фильтрации
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_opt_status ON public.profiles(opt_status);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_rating ON public.profiles(rating) WHERE rating IS NOT NULL;

-- Композитный индекс для часто используемых комбинаций фильтров
CREATE INDEX IF NOT EXISTS idx_profiles_status_type ON public.profiles(verification_status, user_type);

-- Индекс для быстрого получения админов
CREATE INDEX IF NOT EXISTS idx_profiles_admin_users ON public.profiles(user_type, id) WHERE user_type = 'admin';
