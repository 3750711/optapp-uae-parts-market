-- Проверяем точные сигнатуры существующих функций
SELECT 
  routine_name, 
  routine_type,
  (array_to_string(array_agg(parameter_name || ' ' || data_type ORDER BY ordinal_position), ', ')) as parameters
FROM information_schema.routines 
LEFT JOIN information_schema.parameters ON routines.specific_name = parameters.specific_name
WHERE routine_schema = 'public' 
AND routine_name IN ('send_password_reset_code', 'verify_reset_code', 'check_ip_rate_limit', 'log_security_event')
GROUP BY routine_name, routine_type, routines.specific_name;

-- Удаляем все варианты этих функций
DROP FUNCTION IF EXISTS public.send_password_reset_code CASCADE;
DROP FUNCTION IF EXISTS public.verify_reset_code CASCADE;  
DROP FUNCTION IF EXISTS public.check_ip_rate_limit CASCADE;
DROP FUNCTION IF EXISTS public.log_security_event CASCADE;

-- Добавляем поле has_password для Telegram пользователей, если его нет
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_password BOOLEAN DEFAULT true;

-- Обновляем существующих Telegram пользователей
UPDATE public.profiles 
SET has_password = false 
WHERE telegram_id IS NOT NULL AND has_password IS NULL;