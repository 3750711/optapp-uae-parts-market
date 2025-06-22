
-- Удаляем существующие функции если они есть
DROP FUNCTION IF EXISTS public.cleanup_expired_verification_codes();
DROP FUNCTION IF EXISTS public.send_verification_code(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.verify_email_code(TEXT, TEXT);

-- Создаем таблицу для кодов верификации email (если не существует)
CREATE TABLE IF NOT EXISTS public.email_verification_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  ip_address INET
);

-- Создаем индексы (если не существуют)
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email_code 
ON public.email_verification_codes (email, code);

CREATE INDEX IF NOT EXISTS idx_email_verification_codes_expires_at 
ON public.email_verification_codes (expires_at);

-- Функция для генерации и сохранения кода верификации
CREATE OR REPLACE FUNCTION public.send_verification_code(
  p_email TEXT,
  p_ip_address TEXT DEFAULT NULL
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
  FROM public.email_verification_codes
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
  v_expires_at := NOW() + INTERVAL '5 minutes';
  
  -- Сохраняем код в базе данных
  INSERT INTO public.email_verification_codes (
    email, 
    code, 
    expires_at, 
    ip_address
  ) VALUES (
    p_email, 
    v_code, 
    v_expires_at, 
    p_ip_address::INET
  );
  
  -- Возвращаем успешный результат с кодом (для отладки)
  RETURN json_build_object(
    'success', true,
    'message', 'Код отправлен успешно',
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

-- Функция для проверки кода верификации
CREATE OR REPLACE FUNCTION public.verify_email_code(
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
  FROM public.email_verification_codes
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
  UPDATE public.email_verification_codes
  SET used = true
  WHERE id = v_record.id;
  
  -- Возвращаем успех
  RETURN json_build_object(
    'success', true,
    'message', 'Email успешно подтвержден'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Ошибка при проверке кода'
    );
END;
$$;

-- Функция для очистки истекших кодов
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.email_verification_codes
  WHERE expires_at < NOW() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
