-- Фаза 3: Функции безопасности и аутентификации

-- 7. Исправляем get_email_by_opt_id
CREATE OR REPLACE FUNCTION public.get_email_by_opt_id(p_opt_id text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  user_email text;
BEGIN
  -- Ищем email по opt_id в таблице profiles
  SELECT email INTO user_email
  FROM public.profiles
  WHERE opt_id = p_opt_id
  LIMIT 1;
  
  RETURN user_email;
END;
$function$;

-- 8. Исправляем verify_and_reset_password_v2
CREATE OR REPLACE FUNCTION public.verify_and_reset_password_v2(p_email text, p_code text, p_new_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  reset_record RECORD;
  user_auth_id UUID;
  result JSON;
BEGIN
  -- Детальное логирование начала операции
  RAISE LOG 'Starting password reset verification for email: %', p_email;
  
  -- Ищем активный код
  SELECT * INTO reset_record
  FROM public.password_reset_codes
  WHERE email = p_email 
    AND code = p_code 
    AND used = false
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Проверяем, найден ли код
  IF reset_record IS NULL THEN
    RAISE LOG 'No valid reset code found for email: %, code: %', p_email, p_code;
    RETURN json_build_object(
      'success', false,
      'message', 'Неверный или истекший код подтверждения',
      'debug_info', json_build_object(
        'email', p_email,
        'code_provided', p_code,
        'timestamp', NOW()
      )
    );
  END IF;
  
  RAISE LOG 'Found valid reset code for email: %, created at: %', p_email, reset_record.created_at;
  
  -- Помечаем код как использованный
  UPDATE public.password_reset_codes
  SET used = true
  WHERE id = reset_record.id;
  
  RAISE LOG 'Marked reset code as used for email: %', p_email;
  
  -- Находим пользователя по email в auth.users
  SELECT au.id INTO user_auth_id
  FROM auth.users au
  WHERE au.email = p_email;
  
  IF user_auth_id IS NULL THEN
    RAISE LOG 'No user found in auth.users for email: %', p_email;
    RETURN json_build_object(
      'success', false,
      'message', 'Пользователь не найден в системе аутентификации',
      'debug_info', json_build_object(
        'email', p_email,
        'reset_code_id', reset_record.id
      )
    );
  END IF;
  
  RAISE LOG 'Found user in auth.users: % for email: %', user_auth_id, p_email;
  
  -- Возвращаем успех с информацией для дальнейшего использования Admin API
  -- Пароль будет изменен через Edge Function с Admin API
  RETURN json_build_object(
    'success', true,
    'message', 'Код подтвержден, готов к смене пароля',
    'user_id', user_auth_id,
    'email', p_email,
    'reset_code_id', reset_record.id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Exception in verify_and_reset_password_v2: %, SQLSTATE: %', SQLERRM, SQLSTATE;
    RETURN json_build_object(
      'success', false,
      'message', 'Произошла ошибка при проверке кода',
      'debug_info', json_build_object(
        'error', SQLERRM,
        'sqlstate', SQLSTATE,
        'email', p_email
      )
    );
END;
$function$;