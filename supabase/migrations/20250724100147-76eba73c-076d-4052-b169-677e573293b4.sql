-- Add is_trusted_seller column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_trusted_seller BOOLEAN NOT NULL DEFAULT false;

-- Update existing trusted users based on hardcoded lists
UPDATE public.profiles 
SET is_trusted_seller = true 
WHERE email IN (
  'geoo1999@mail.ru',
  'bahtin4ik409@yandex.ru', 
  'Mail-igorek@mail.ru',
  'Mironenkonastya1997@mail.ru',
  'dorovskikh.toni@bk.ru',
  'ts12@g.com',
  'fa@g.com'
) OR telegram IN (
  'Elena_gult',
  'SanSanichUAE', 
  'OptSeller_Georgii',
  'Nastya_PostingLots_OptCargo',
  'OptSeller_IgorK',
  'faruknose'
);

-- Update the auto_approve_trusted_seller_products function to check the new field
CREATE OR REPLACE FUNCTION public.auto_approve_trusted_seller_products()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_email TEXT;
  is_trusted BOOLEAN := FALSE;
BEGIN
  -- Получаем email пользователя из таблицы profiles
  SELECT email, is_trusted_seller INTO user_email, is_trusted
  FROM public.profiles
  WHERE id = NEW.seller_id;
  
  -- Проверяем, является ли пользователь доверенным
  -- 1. Проверяем флаг is_trusted_seller
  -- 2. Проверяем хардкод списки (для обратной совместимости)
  IF is_trusted = TRUE OR 
     user_email IN (
       'geoo1999@mail.ru',
       'bahtin4ik409@yandex.ru',
       'Mail-igorek@mail.ru',
       'Mironenkonastya1997@mail.ru',
       'dorovskikh.toni@bk.ru',
       'ts12@g.com',
       'fa@g.com'
     ) OR NEW.telegram_url IN (
       'Elena_gult',
       'SanSanichUAE',
       'OptSeller_Georgii',
       'Nastya_PostingLots_OptCargo',
       'OptSeller_IgorK',
       'faruknose'
     ) THEN
    -- Для доверенных пользователей сразу устанавливаем статус active
    NEW.status = 'active';
    is_trusted := TRUE;
  END IF;
  
  RETURN NEW;
END;
$function$;