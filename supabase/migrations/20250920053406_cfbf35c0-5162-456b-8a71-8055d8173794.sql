-- Расширяем существующую таблицу event_logs для мониторинга активности пользователей
-- Добавляем поля для отслеживания активности пользователей

-- Добавляем новые колонки
ALTER TABLE public.event_logs 
ADD COLUMN IF NOT EXISTS ip_address inet,
ADD COLUMN IF NOT EXISTS user_agent text,
ADD COLUMN IF NOT EXISTS path text,
ADD COLUMN IF NOT EXISTS event_subtype text;

-- Создаём индексы для производительности мониторинга активности
CREATE INDEX IF NOT EXISTS idx_event_logs_user_created_at 
ON public.event_logs (user_id, created_at DESC) 
WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_event_logs_action_type_created_at 
ON public.event_logs (action_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_logs_created_at 
ON public.event_logs (created_at DESC);

-- Индекс для поиска по типу события (для фильтрации в админке)
CREATE INDEX IF NOT EXISTS idx_event_logs_action_entity_created_at 
ON public.event_logs (action_type, entity_type, created_at DESC);

-- Комментарии для новых полей
COMMENT ON COLUMN public.event_logs.ip_address IS 'IP адрес пользователя для мониторинга активности';
COMMENT ON COLUMN public.event_logs.user_agent IS 'User-Agent браузера для анализа устройств';
COMMENT ON COLUMN public.event_logs.path IS 'URL путь для отслеживания навигации';
COMMENT ON COLUMN public.event_logs.event_subtype IS 'Подтип события для детализации активности';