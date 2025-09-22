-- Переименование функций для избежания конфликта перегрузки

-- Функция для простых продавцов
CREATE OR REPLACE FUNCTION public.create_standard_product(
  p_title TEXT,
  p_price NUMERIC,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  product_id UUID;
  user_profile RECORD;
BEGIN
  -- Получаем профиль пользователя
  SELECT id, full_name, user_type, is_trusted_seller, opt_id
  INTO user_profile
  FROM public.profiles
  WHERE id = auth.uid();

  IF user_profile IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Вставляем товар
  INSERT INTO public.products (
    title,
    price,
    description,
    condition,
    brand,
    model,
    seller_id,
    seller_name,
    status,
    place_number,
    delivery_price,
    optid_created
  ) VALUES (
    p_title,
    p_price,
    COALESCE(p_description, ''),
    'Новый',
    '',
    NULL,
    user_profile.id,
    COALESCE(user_profile.full_name, 'Unknown Seller'),
    CASE 
      WHEN user_profile.is_trusted_seller THEN 'active'::product_status
      ELSE 'pending'::product_status
    END,
    1,
    0,
    user_profile.opt_id
  )
  RETURNING id INTO product_id;

  RETURN product_id;
END;
$$;

-- Функция для доверенных продавцов (расширенные параметры)
CREATE OR REPLACE FUNCTION public.create_trusted_product(
  p_title TEXT,
  p_price NUMERIC,
  p_description TEXT DEFAULT NULL,
  p_condition TEXT DEFAULT 'Новый',
  p_brand TEXT DEFAULT '',
  p_model TEXT DEFAULT NULL,
  p_place_number INTEGER DEFAULT 1,
  p_delivery_price NUMERIC DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  product_id UUID;
  user_profile RECORD;
BEGIN
  -- Получаем профиль пользователя
  SELECT id, full_name, user_type, is_trusted_seller, opt_id
  INTO user_profile
  FROM public.profiles
  WHERE id = auth.uid();

  IF user_profile IS NULL THEN
    RAISE EXCEPTION 'User profile not found';
  END IF;

  -- Проверяем что пользователь доверенный продавец
  IF NOT user_profile.is_trusted_seller THEN
    RAISE EXCEPTION 'Only trusted sellers can use this function';
  END IF;

  -- Вставляем товар
  INSERT INTO public.products (
    title,
    price,
    description,
    condition,
    brand,
    model,
    seller_id,
    seller_name,
    status,
    place_number,
    delivery_price,
    optid_created
  ) VALUES (
    p_title,
    p_price,
    COALESCE(p_description, ''),
    p_condition,
    p_brand,
    p_model,
    user_profile.id,
    COALESCE(user_profile.full_name, 'Unknown Seller'),
    'active'::product_status, -- Доверенные продавцы получают сразу активный статус
    p_place_number,
    p_delivery_price,
    user_profile.opt_id
  )
  RETURNING id INTO product_id;

  RETURN product_id;
END;
$$;

-- Удаляем старые функции с конфликтами
DROP FUNCTION IF EXISTS public.create_product_with_images(p_title TEXT, p_price NUMERIC, p_description TEXT, p_condition TEXT, p_brand TEXT, p_place_number INTEGER, p_delivery_price NUMERIC);
DROP FUNCTION IF EXISTS public.create_product_with_images(p_title TEXT, p_price NUMERIC, p_description TEXT, p_condition TEXT, p_brand TEXT, p_model TEXT, p_place_number INTEGER, p_delivery_price NUMERIC);