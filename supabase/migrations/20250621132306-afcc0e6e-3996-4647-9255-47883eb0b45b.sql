
-- Создаем функцию для принудительного выхода пользователя и инвалидации всех его токенов
CREATE OR REPLACE FUNCTION public.force_user_logout()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Проверяем, что пользователь авторизован
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to logout';
  END IF;

  -- Логируем принудительный выход
  INSERT INTO event_logs (
    action_type, 
    entity_type, 
    entity_id, 
    user_id,
    details
  ) 
  VALUES (
    'force_logout', 
    'auth', 
    auth.uid(), 
    auth.uid(),
    jsonb_build_object(
      'timestamp', NOW(),
      'forced', true
    )
  );

  -- Инвалидируем все refresh токены пользователя в auth.refresh_tokens
  -- Это заставит все сессии пользователя стать недействительными
  UPDATE auth.refresh_tokens 
  SET revoked = true, updated_at = NOW()
  WHERE user_id = auth.uid() AND revoked = false;

  -- Обновляем timestamp последнего выхода в профиле пользователя
  UPDATE public.profiles 
  SET updated_at = NOW()
  WHERE id = auth.uid();
END;
$$;

-- Создаем функцию для проверки, был ли пользователь принудительно разлогинен
CREATE OR REPLACE FUNCTION public.check_force_logout_status(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last_force_logout timestamp;
  user_updated_at timestamp;
BEGIN
  -- Получаем время последнего принудительного выхода
  SELECT created_at INTO last_force_logout
  FROM event_logs
  WHERE user_id = p_user_id 
    AND action_type = 'force_logout'
    AND entity_type = 'auth'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Если нет записей о принудительном выходе, возвращаем false
  IF last_force_logout IS NULL THEN
    RETURN false;
  END IF;

  -- Получаем время последнего обновления профиля
  SELECT updated_at INTO user_updated_at
  FROM public.profiles
  WHERE id = p_user_id;

  -- Если принудительный выход был недавно (в последние 5 минут), считаем что нужно разлогинить
  IF last_force_logout > NOW() - INTERVAL '5 minutes' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;
