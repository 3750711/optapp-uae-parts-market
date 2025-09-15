-- Удаляем оставшиеся функции старой системы сброса пароля
DROP FUNCTION IF EXISTS public.send_password_reset_code(text, inet);
DROP FUNCTION IF EXISTS public.verify_reset_code(text, text);
DROP FUNCTION IF EXISTS public.check_ip_rate_limit(inet, text);
DROP FUNCTION IF EXISTS public.log_security_event(text, text, text, inet, uuid);

-- Проверяем, что все функции удалены
DO $$
DECLARE
  func_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO func_count
  FROM information_schema.routines 
  WHERE routine_schema = 'public' 
  AND routine_name IN (
    'send_password_reset_code',
    'verify_reset_code',
    'check_ip_rate_limit',
    'log_security_event'
  );
  
  IF func_count > 0 THEN
    RAISE WARNING 'Still have % old functions remaining', func_count;
  ELSE
    RAISE LOG 'All old password reset functions successfully removed';
  END IF;
END $$;