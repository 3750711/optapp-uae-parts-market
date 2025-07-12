-- Функция для очистки старых кодов верификации (административная)
CREATE OR REPLACE FUNCTION public.cleanup_verification_codes_for_email(p_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Проверяем, что пользователь является администратором
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can use this function';
  END IF;

  -- Удаляем все старые коды для указанного email
  DELETE FROM public.email_verification_codes
  WHERE email = p_email;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN json_build_object(
    'success', true,
    'message', format('Удалено %s кодов для email %s', deleted_count, p_email),
    'deleted_count', deleted_count
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Ошибка при очистке кодов: ' || SQLERRM
    );
END;
$$;