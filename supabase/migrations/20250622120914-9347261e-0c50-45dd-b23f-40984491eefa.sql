
-- Удаляем дублирующие функции для email верификации
DROP FUNCTION IF EXISTS public.send_verification_code(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.verify_email_code(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.cleanup_expired_verification_codes();

-- Удаляем дублирующую таблицу email_verification_codes
DROP TABLE IF EXISTS public.email_verification_codes;

-- Создаем функцию для создания кода сброса пароля (если не существует)
CREATE OR REPLACE FUNCTION public.create_password_reset_code(
  p_email TEXT,
  p_opt_id TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code TEXT;
  v_expires_at TIMESTAMP WITH TIME ZONE;
  recent_requests INTEGER;
BEGIN
  -- Проверяем количество запросов за последние 5 минут для данного email
  SELECT COUNT(*) INTO recent_requests
  FROM public.password_reset_codes
  WHERE email = p_email 
    AND created_at > NOW() - INTERVAL '5 minutes';
  
  -- Ограничиваем до 3 запросов в 5 минут
  IF recent_requests >= 3 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Слишком много запросов. Попробуйте позже.',
      'code', null
    );
  END IF;
  
  -- Генерируем 6-значный код
  v_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  v_expires_at := NOW() + INTERVAL '10 minutes';
  
  -- Используем UPSERT для обновления или создания записи
  INSERT INTO public.password_reset_codes (
    email, 
    code, 
    expires_at, 
    opt_id,
    used
  ) VALUES (
    p_email, 
    v_code, 
    v_expires_at, 
    p_opt_id,
    false
  )
  ON CONFLICT (email) 
  DO UPDATE SET
    code = EXCLUDED.code,
    expires_at = EXCLUDED.expires_at,
    opt_id = EXCLUDED.opt_id,
    used = false,
    created_at = NOW();
  
  -- Возвращаем успешный результат с кодом
  RETURN json_build_object(
    'success', true,
    'message', 'Код создан успешно',
    'code', v_code
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Ошибка при создании кода',
      'code', null
    );
END;
$$;

-- Создаем функцию для проверки кода (используем существующую логику)
CREATE OR REPLACE FUNCTION public.verify_reset_code(
  p_email TEXT,
  p_code TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record RECORD;
BEGIN
  -- Ищем действительный код
  SELECT * INTO v_record
  FROM public.password_reset_codes
  WHERE email = p_email 
    AND code = p_code 
    AND used = false
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Проверяем, найден ли код
  IF v_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Неверный или истекший код'
    );
  END IF;
  
  -- Помечаем код как использованный
  UPDATE public.password_reset_codes
  SET used = true
  WHERE id = v_record.id;
  
  -- Возвращаем успех
  RETURN json_build_object(
    'success', true,
    'message', 'Код подтвержден успешно'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Ошибка при проверке кода'
    );
END;
$$;
