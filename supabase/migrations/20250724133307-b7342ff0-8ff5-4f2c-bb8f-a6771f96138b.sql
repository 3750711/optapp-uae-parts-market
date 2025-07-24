-- Fix additional critical SECURITY DEFINER functions with search path
-- Using correct type names from the schema

-- 6. Fix get_next_order_number function
CREATE OR REPLACE FUNCTION public.get_next_order_number()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Проверяем, что пользователь является администратором, продавцом или покупателем
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'seller', 'buyer')
  ) THEN
    RAISE EXCEPTION 'Only authenticated users can use this function';
  END IF;

  -- Блокируем таблицу для предотвращения конкурентного доступа
  LOCK TABLE public.orders IN ACCESS EXCLUSIVE MODE;
  
  -- Получаем максимальный номер заказа и добавляем 1
  SELECT COALESCE(MAX(order_number), 0) + 1 
  INTO next_number 
  FROM public.orders;
  
  RETURN next_number;
END;
$$;

-- 7. Fix delete_user_account function
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Delete the user's profile
  DELETE FROM public.profiles WHERE id = auth.uid();
  
  -- Delete the user's auth account
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- 8. Fix check_user_not_blocked function
CREATE OR REPLACE FUNCTION public.check_user_not_blocked()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND verification_status = 'blocked'
  ) THEN
    RAISE EXCEPTION 'User is blocked';
  END IF;
  RETURN NEW;
END;
$$;

-- 9. Fix admin functions with proper search path
CREATE OR REPLACE FUNCTION public.admin_delete_store(p_store_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only proceed if user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can use this function';
  END IF;

  -- Delete all store car brands associations
  DELETE FROM public.store_car_brands
  WHERE store_id = p_store_id;
  
  -- Delete all store car models associations
  DELETE FROM public.store_car_models
  WHERE store_id = p_store_id;
  
  -- Delete all store reviews
  DELETE FROM public.store_reviews
  WHERE store_id = p_store_id;
  
  -- Delete all store images
  DELETE FROM public.store_images
  WHERE store_id = p_store_id;
  
  -- Finally delete the store
  DELETE FROM public.stores
  WHERE id = p_store_id;
  
  RETURN TRUE;
END;
$$;