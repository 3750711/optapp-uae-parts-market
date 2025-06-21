
-- Создаем таблицу для хранения кодов сброса пароля
CREATE TABLE IF NOT EXISTS public.password_reset_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  opt_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Создаем уникальный индекс по email для upsert
  CONSTRAINT unique_email_reset UNIQUE (email)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_email ON public.password_reset_codes(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_code ON public.password_reset_codes(code);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_expires_at ON public.password_reset_codes(expires_at);

-- Функция для проверки кода и сброса пароля
CREATE OR REPLACE FUNCTION public.verify_and_reset_password(
  p_email TEXT,
  p_code TEXT,
  p_new_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reset_record RECORD;
  user_id UUID;
  result JSON;
BEGIN
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
    RETURN json_build_object(
      'success', false,
      'message', 'Неверный или истекший код подтверждения'
    );
  END IF;
  
  -- Помечаем код как использованный
  UPDATE public.password_reset_codes
  SET used = true
  WHERE id = reset_record.id;
  
  -- Находим пользователя по email
  SELECT au.id INTO user_id
  FROM auth.users au
  WHERE au.email = p_email;
  
  IF user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Пользователь не найден'
    );
  END IF;
  
  -- Обновляем пароль в auth.users
  UPDATE auth.users
  SET 
    encrypted_password = crypt(p_new_password, gen_salt('bf')),
    updated_at = NOW()
  WHERE id = user_id;
  
  -- Логируем событие
  INSERT INTO public.event_logs (
    action_type, 
    entity_type, 
    entity_id, 
    user_id,
    details
  ) 
  VALUES (
    'password_reset', 
    'user', 
    user_id, 
    user_id,
    json_build_object(
      'email', p_email,
      'opt_id', reset_record.opt_id,
      'reset_at', NOW()
    )
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Пароль успешно изменен'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Произошла ошибка при изменении пароля'
    );
END;
$$;

-- Функция для очистки старых кодов (можно запускать периодически)
CREATE OR REPLACE FUNCTION public.cleanup_expired_password_reset_codes()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.password_reset_codes
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$;

-- RLS политики
ALTER TABLE public.password_reset_codes ENABLE ROW LEVEL SECURITY;

-- Только система может управлять кодами сброса
CREATE POLICY "System manages password reset codes" ON public.password_reset_codes
FOR ALL USING (false) WITH CHECK (false);
