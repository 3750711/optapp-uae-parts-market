
-- Function to allow admins to create products on behalf of sellers
CREATE OR REPLACE FUNCTION public.admin_create_product(
  p_title TEXT,
  p_price NUMERIC,
  p_condition TEXT,
  p_brand TEXT,
  p_model TEXT,
  p_description TEXT,
  p_seller_id UUID,
  p_seller_name TEXT,
  p_status product_status,
  p_place_number INTEGER,
  p_delivery_price NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- This function will run with the privileges of the definer (typically the DB owner)
AS $$
DECLARE
  product_id UUID;
BEGIN
  -- Only proceed if user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can use this function';
  END IF;

  -- Insert the product and return the ID
  INSERT INTO public.products (
    title,
    price,
    condition,
    brand,
    model,
    description,
    seller_id,
    seller_name,
    status,
    place_number,
    delivery_price
  ) VALUES (
    p_title,
    p_price,
    p_condition,
    p_brand,
    p_model,
    p_description,
    p_seller_id,
    p_seller_name,
    p_status,
    p_place_number,
    p_delivery_price
  )
  RETURNING id INTO product_id;

  RETURN product_id;
END;
$$;

-- Function to allow admins to insert product images
CREATE OR REPLACE FUNCTION public.admin_insert_product_image(
  p_product_id UUID,
  p_url TEXT,
  p_is_primary BOOLEAN DEFAULT false
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only proceed if user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can use this function';
  END IF;

  INSERT INTO public.product_images (
    product_id,
    url,
    is_primary
  ) VALUES (
    p_product_id,
    p_url,
    p_is_primary
  );
END;
$$;

-- Function to allow admins to insert product videos
CREATE OR REPLACE FUNCTION public.admin_insert_product_video(
  p_product_id UUID,
  p_url TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only proceed if user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can use this function';
  END IF;

  INSERT INTO public.product_videos (
    product_id,
    url
  ) VALUES (
    p_product_id,
    p_url
  );
END;
$$;

-- Обновленная функция для авто-одобрения товаров доверенных продавцов
CREATE OR REPLACE FUNCTION public.auto_approve_trusted_seller_products()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
  is_trusted BOOLEAN := FALSE;
BEGIN
  -- Получаем email пользователя из таблицы profiles
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
    'ts12@g.com'
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
  END IF;
  
  RETURN NEW;
END;
$$;

-- Создаем триггер для автоматического одобрения товаров доверенных продавцов
DROP TRIGGER IF EXISTS trigger_auto_approve_trusted_seller_products ON public.products;
CREATE TRIGGER trigger_auto_approve_trusted_seller_products
BEFORE INSERT ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.auto_approve_trusted_seller_products();
