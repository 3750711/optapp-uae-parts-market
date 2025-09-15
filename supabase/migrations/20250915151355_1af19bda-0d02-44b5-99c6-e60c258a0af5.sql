-- Удаляем все варианты старых функций с каскадом
DROP FUNCTION IF EXISTS public.send_password_reset_code CASCADE;
DROP FUNCTION IF EXISTS public.verify_reset_code CASCADE;  
DROP FUNCTION IF EXISTS public.check_ip_rate_limit CASCADE;
DROP FUNCTION IF EXISTS public.log_security_event CASCADE;

-- Добавляем поле has_password для Telegram пользователей, если его нет
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_password BOOLEAN DEFAULT true;

-- Обновляем существующих Telegram пользователей (устанавливаем has_password = false)
UPDATE public.profiles 
SET has_password = false 
WHERE telegram_id IS NOT NULL;