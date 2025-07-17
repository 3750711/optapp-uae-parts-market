-- Обновляем функцию delete_user_account для работы с любым пользователем (только для админов)
CREATE OR REPLACE FUNCTION public.delete_user_account(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Проверяем, что текущий пользователь является администратором
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can delete user accounts';
  END IF;

  -- Проверяем, что пользователь существует
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id
  ) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Удаляем профиль пользователя
  DELETE FROM public.profiles WHERE id = user_id;
  
  -- Удаляем аккаунт аутентификации
  DELETE FROM auth.users WHERE id = user_id;
END;
$$;