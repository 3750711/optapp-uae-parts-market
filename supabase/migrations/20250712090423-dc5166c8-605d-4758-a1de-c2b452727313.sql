-- Упрощение системы email верификации: удаляем старые функции и создаем новые без контекста

-- Удаляем существующие функции с контекстом
DROP FUNCTION IF EXISTS public.send_email_verification_code(TEXT, INET, TEXT);
DROP FUNCTION IF EXISTS public.verify_email_verification_code(TEXT, TEXT, TEXT);

-- Создаем упрощенную функцию отправки кода верификации email (без контекста)
CREATE OR REPLACE FUNCTION public.send_email_verification_code(
  p_email TEXT,
  p_ip_address INET DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code TEXT;
  v_recent_count INTEGER;
BEGIN
  -- Rate limiting: max 3 codes per hour per email
  SELECT COUNT(*) INTO v_recent_count
  FROM public.email_verification_codes
  WHERE email = p_email 
    AND created_at > NOW() - INTERVAL '1 hour';
    
  IF v_recent_count >= 3 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Слишком много попыток. Попробуйте через час.'
    );
  END IF;
  
  -- Generate 6-digit code
  v_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  
  -- Insert new verification code
  INSERT INTO public.email_verification_codes (
    email, 
    code, 
    expires_at, 
    ip_address
  ) VALUES (
    p_email,
    v_code,
    NOW() + INTERVAL '5 minutes',
    p_ip_address
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Код отправлен на email',
    'code', v_code
  );
END;
$$;

-- Создаем упрощенную функцию верификации кода email (без контекста)
CREATE OR REPLACE FUNCTION public.verify_email_verification_code(
  p_email TEXT,
  p_code TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record RECORD;
  v_user_id UUID;
BEGIN
  -- Find valid code
  SELECT * INTO v_record
  FROM public.email_verification_codes
  WHERE email = p_email 
    AND code = p_code 
    AND used = false
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Неверный или истекший код'
    );
  END IF;
  
  -- Mark code as used
  UPDATE public.email_verification_codes
  SET used = true
  WHERE id = v_record.id;
  
  -- Get user ID by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Пользователь не найден'
    );
  END IF;
  
  -- Update auth.users.email_confirmed_at
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = v_user_id;
  
  -- Update profiles.email_confirmed
  UPDATE public.profiles
  SET email_confirmed = true
  WHERE id = v_user_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Email успешно подтвержден'
  );
END;
$$;