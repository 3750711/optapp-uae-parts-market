
-- Добавляем ts99@g.com в список доверенных продавцов
CREATE OR REPLACE FUNCTION public.auto_approve_trusted_seller_products()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
  is_trusted BOOLEAN := FALSE;
BEGIN
  -- Получаем email пользователя из таблицы profiles вместо auth.users
  SELECT email INTO user_email
  FROM public.profiles
  WHERE id = NEW.seller_id;
  
  -- Список доверенных email адресов или telegram аккаунтов
  IF user_email IN (
    'geoo1999@mail.ru',
    'bahtin4ik409@yandex.ru',
    'Mail-igorek@mail.ru',
    'Mironenkonastya1997@mail.ru',
    'dorovskikh.toni@bk.ru',
    'ts12@g.com',
    'ts99@g.com'
  ) OR NEW.telegram_url IN (
    'Elena_gult',
    'SanSanichUAE',
    'OptSeller_Georgii',
    'Nastya_PostingLots_OptCargo',
    'OptSeller_IgorK'
  ) THEN
    -- Для доверенных пользователей сразу устанавливаем статус active
    NEW.status = 'active';
    is_trusted := TRUE;
    -- Убираем установку last_notification_sent_at, так как это теперь будет 
    -- обрабатываться через trigger на INSERT
  END IF;
  
  RETURN NEW;
END;
$$;
