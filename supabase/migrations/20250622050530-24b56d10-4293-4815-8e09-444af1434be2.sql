
-- Удаляем старую функцию verify_and_reset_password если она существует
DROP FUNCTION IF EXISTS public.verify_and_reset_password(TEXT, TEXT, TEXT);

-- Очищаем таблицу password_reset_codes от старых записей (старше 24 часов)
DELETE FROM public.password_reset_codes 
WHERE created_at < NOW() - INTERVAL '24 hours';

-- Очищаем таблицу password_reset_codes от использованных кодов
DELETE FROM public.password_reset_codes 
WHERE used = true;

-- Очищаем истекшие коды
DELETE FROM public.password_reset_codes 
WHERE expires_at < NOW();

-- Добавляем индекс для улучшения производительности очистки
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_cleanup 
ON public.password_reset_codes (created_at, used, expires_at);

-- Создаем функцию для создания кодов сброса пароля (если не существует)
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
  -- Проверяем количество запросов за последние 15 минут для данного email
  SELECT COUNT(*) INTO recent_requests
  FROM public.password_reset_codes
  WHERE email = p_email 
    AND created_at > NOW() - INTERVAL '15 minutes';
  
  -- Ограничиваем до 3 запросов в 15 минут
  IF recent_requests >= 3 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Слишком много запросов. Попробуйте через 15 минут.',
      'code', null
    );
  END IF;
  
  -- Генерируем 6-значный код
  v_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  v_expires_at := NOW() + INTERVAL '10 minutes';
  
  -- Сохраняем код в базе данных
  INSERT INTO public.password_reset_codes (
    email, 
    code, 
    expires_at, 
    opt_id
  ) VALUES (
    p_email, 
    v_code, 
    v_expires_at, 
    p_opt_id
  );
  
  -- Возвращаем успешный результат с кодом (для отладки)
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
