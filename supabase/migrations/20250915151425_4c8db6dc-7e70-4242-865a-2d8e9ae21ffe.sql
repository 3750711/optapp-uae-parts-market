-- Удаляем функции с точными сигнатурами
DROP FUNCTION IF EXISTS public.check_ip_rate_limit(p_ip_address text, p_action text, p_limit integer, p_window_hours integer);
DROP FUNCTION IF EXISTS public.check_ip_rate_limit(p_ip_address inet, p_action text, p_limit integer, p_window_minutes integer);
DROP FUNCTION IF EXISTS public.log_security_event(p_action text, p_user_id uuid, p_ip_address inet, p_user_agent text, p_error_message text, p_details jsonb);
DROP FUNCTION IF EXISTS public.log_security_event(p_action text, p_email text, p_user_id uuid, p_ip_address inet, p_user_agent text, p_success boolean, p_error_message text, p_metadata jsonb);
DROP FUNCTION IF EXISTS public.send_password_reset_code(p_email text, p_opt_id text);

-- Добавляем поле has_password если его нет
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_password BOOLEAN DEFAULT true;

-- Обновляем Telegram пользователей
UPDATE public.profiles 
SET has_password = false 
WHERE telegram_id IS NOT NULL;