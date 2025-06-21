
-- Создаем функцию для верификации email кода
CREATE OR REPLACE FUNCTION public.verify_email_code(
  p_email TEXT,
  p_code TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  verification_record RECORD;
  result JSON;
BEGIN
  -- Ищем активный код верификации
  SELECT * INTO verification_record
  FROM public.email_verification_codes
  WHERE email = p_email 
    AND code = p_code 
    AND used = false
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Проверяем, найден ли код
  IF verification_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Неверный или истекший код подтверждения'
    );
  END IF;
  
  -- Помечаем код как использованный
  UPDATE public.email_verification_codes
  SET used = true
  WHERE id = verification_record.id;
  
  -- Обновляем статус email в профиле пользователя
  UPDATE public.profiles
  SET email = p_email
  WHERE email = p_email OR id IN (
    SELECT id FROM public.profiles WHERE email = p_email
  );
  
  -- Логируем успешную верификацию
  INSERT INTO public.event_logs (
    action_type, 
    entity_type, 
    entity_id, 
    user_id,
    details
  ) 
  VALUES (
    'email_verified', 
    'profile', 
    auth.uid(), 
    auth.uid(),
    json_build_object(
      'email', p_email,
      'verified_at', NOW()
    )
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Email успешно подтвержден'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Произошла ошибка при проверке кода',
      'error', SQLERRM
    );
END;
$$;

-- Создаем функцию проверки rate limiting для IP адресов
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_action TEXT,
  p_ip_address INET DEFAULT NULL,
  p_limit_per_hour INTEGER DEFAULT 10
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  attempt_count INTEGER;
BEGIN
  -- Если IP не предоставлен, разрешаем действие
  IF p_ip_address IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Подсчитываем количество попыток за последний час
  SELECT COUNT(*) INTO attempt_count
  FROM public.login_attempts
  WHERE ip_address = p_ip_address
    AND attempt_type = p_action
    AND created_at > NOW() - INTERVAL '1 hour';
  
  -- Возвращаем результат проверки лимита
  RETURN attempt_count < p_limit_per_hour;
END;
$$;

-- Обновляем функцию get_email_by_opt_id с improved rate limiting
CREATE OR REPLACE FUNCTION public.get_email_by_opt_id(
  p_opt_id TEXT,
  p_ip_address INET DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Проверяем rate limiting
  IF NOT public.check_rate_limit('opt_id_lookup', p_ip_address, 20) THEN
    -- Логируем превышение лимита
    INSERT INTO public.login_attempts (
      identifier, 
      ip_address, 
      attempt_type, 
      success, 
      error_message
    ) VALUES (
      p_opt_id, 
      p_ip_address, 
      'opt_id_lookup', 
      false, 
      'Rate limit exceeded'
    );
    
    RAISE EXCEPTION 'Rate limit exceeded for IP address';
  END IF;
  
  -- Ищем email по opt_id
  SELECT email INTO user_email
  FROM public.profiles
  WHERE opt_id = p_opt_id
  LIMIT 1;
  
  -- Логируем попытку поиска
  INSERT INTO public.login_attempts (
    identifier, 
    ip_address, 
    attempt_type, 
    success, 
    error_message
  ) VALUES (
    p_opt_id, 
    p_ip_address, 
    'opt_id_lookup', 
    (user_email IS NOT NULL), 
    CASE WHEN user_email IS NULL THEN 'OPT ID not found' ELSE NULL END
  );
  
  RETURN user_email;
END;
$$;

-- Обновляем функцию check_opt_id_exists с rate limiting
CREATE OR REPLACE FUNCTION public.check_opt_id_exists(
  p_opt_id TEXT,
  p_ip_address INET DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  opt_exists BOOLEAN;
BEGIN
  -- Проверяем rate limiting
  IF NOT public.check_rate_limit('opt_id_check', p_ip_address, 30) THEN
    RETURN FALSE;
  END IF;
  
  -- Проверяем существование OPT ID
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE opt_id = p_opt_id
  ) INTO opt_exists;
  
  -- Логируем проверку
  INSERT INTO public.login_attempts (
    identifier, 
    ip_address, 
    attempt_type, 
    success
  ) VALUES (
    p_opt_id, 
    p_ip_address, 
    'opt_id_check', 
    opt_exists
  );
  
  RETURN opt_exists;
END;
$$;
