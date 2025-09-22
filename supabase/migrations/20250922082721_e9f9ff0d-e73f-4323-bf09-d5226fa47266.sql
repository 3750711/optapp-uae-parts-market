-- Добавляем Service Role Key в настройки приложения для автоматических HTTP запросов
-- Это необходимо для работы триггеров, которые вызывают Edge Functions
DO $$ 
DECLARE
    service_key TEXT;
BEGIN
    -- Получаем service role key из переменной окружения
    service_key := current_setting('SUPABASE_SERVICE_ROLE_KEY', true);
    
    IF service_key IS NOT NULL AND service_key != '' THEN
        INSERT INTO public.app_settings (key, value) 
        VALUES ('supabase_service_role_key', service_key)
        ON CONFLICT (key) 
        DO UPDATE SET 
            value = EXCLUDED.value, 
            updated_at = NOW();
            
        RAISE LOG 'Service role key added to app_settings for triggers';
    ELSE
        RAISE WARNING 'SUPABASE_SERVICE_ROLE_KEY environment variable is not available';
    END IF;
END $$;