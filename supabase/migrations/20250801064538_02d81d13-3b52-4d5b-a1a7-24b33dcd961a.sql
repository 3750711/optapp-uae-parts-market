-- Фаза 2: Функции заказов и продуктов (высокий приоритет)

-- 4. Исправляем admin_create_product
CREATE OR REPLACE FUNCTION public.admin_create_product(p_title text, p_price numeric, p_condition text, p_brand text, p_model text, p_description text, p_seller_id uuid, p_seller_name text, p_status product_status, p_place_number integer, p_delivery_price numeric)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  product_id UUID;
BEGIN
  -- Only proceed if user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
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
$function$;

-- 5. Исправляем admin_insert_product_image
CREATE OR REPLACE FUNCTION public.admin_insert_product_image(p_product_id uuid, p_url text, p_is_primary boolean DEFAULT false)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Only proceed if user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
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
$function$;

-- 6. Исправляем admin_insert_product_video
CREATE OR REPLACE FUNCTION public.admin_insert_product_video(p_product_id uuid, p_url text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Only proceed if user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
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
$function$;