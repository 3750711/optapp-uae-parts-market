
-- Более производительный индекс для фильтрации по opt_status и сортировки по дате создания
CREATE INDEX IF NOT EXISTS idx_profiles_opt_status_created_at_desc ON public.profiles (opt_status, created_at DESC);

-- Индекс для комбинированной фильтрации по статусу и рейтингу
CREATE INDEX IF NOT EXISTS idx_profiles_status_rating ON public.profiles (verification_status, rating) WHERE rating IS NOT NULL;

-- Более широкий составной индекс для общих комбинаций фильтров
-- Он расширяет существующий idx_profiles_status_type_created
CREATE INDEX IF NOT EXISTS idx_profiles_multi_filter_sort ON public.profiles (verification_status, user_type, opt_status, created_at DESC);
