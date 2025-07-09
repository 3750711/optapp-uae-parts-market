-- Переписываем функцию отправки кода верификации email
CREATE OR REPLACE FUNCTION public.send_email_verification_code(
  p_email TEXT,
  p_ip_address INET DEFAULT NULL,
  p_context TEXT DEFAULT 'registration' -- 'registration' или 'email_change'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code TEXT;
  v_recent_count INTEGER;
  v_current_user_id UUID;
  v_email_exists BOOLEAN;
BEGIN
  -- Для смены email проверяем что пользователь авторизован
  IF p_context = 'email_change' THEN
    v_current_user_id := auth.uid();
    IF v_current_user_id IS NULL THEN
      RETURN json_build_object(
        'success', false,
        'message', 'Пользователь не авторизован'
      );
    END IF;
    
    -- Проверяем что новый email не занят другим пользователем
    SELECT EXISTS(
      SELECT 1 FROM public.profiles 
      WHERE email = p_email AND id != v_current_user_id
    ) INTO v_email_exists;
    
    IF v_email_exists THEN
      RETURN json_build_object(
        'success', false,
        'message', 'Этот email уже используется другим пользователем'
      );
    END IF;
  END IF;
  
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
    'code', v_code -- Only for Edge Function
  );
END;
$$;

-- Переписываем функцию верификации кода email
CREATE OR REPLACE FUNCTION public.verify_email_verification_code(
  p_email TEXT,
  p_code TEXT,
  p_context TEXT DEFAULT 'registration' -- 'registration' или 'email_change'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record RECORD;
  v_user_id UUID;
  v_current_user_id UUID;
  v_old_email TEXT;
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
  
  IF p_context = 'email_change' THEN
    -- Обработка смены email
    v_current_user_id := auth.uid();
    IF v_current_user_id IS NULL THEN
      RETURN json_build_object(
        'success', false,
        'message', 'Пользователь не авторизован'
      );
    END IF;
    
    -- Получаем старый email
    SELECT email INTO v_old_email
    FROM public.profiles
    WHERE id = v_current_user_id;
    
    -- Обновляем email в auth.users
    UPDATE auth.users
    SET email = p_email, email_confirmed_at = NOW()
    WHERE id = v_current_user_id;
    
    -- Обновляем email и статус подтверждения в profiles
    UPDATE public.profiles
    SET email = p_email, email_confirmed = true
    WHERE id = v_current_user_id;
    
    RETURN json_build_object(
      'success', true,
      'message', 'Email успешно изменен и подтвержден',
      'old_email', v_old_email,
      'new_email', p_email
    );
  ELSE
    -- Обработка регистрации
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
  END IF;
END;
$$;