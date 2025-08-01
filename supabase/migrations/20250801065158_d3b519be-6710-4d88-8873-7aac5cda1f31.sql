-- Фаза 1: Критичные функции безопасности (20 функций)
-- Добавляем SET search_path TO '' для защиты от search_path атак

-- 1. Функции административного доступа
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.check_user_not_blocked()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND verification_status = 'blocked'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_force_logout_status()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN COALESCE(
    (SELECT force_logout FROM public.profiles WHERE id = auth.uid()),
    false
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.force_user_logout(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Только админы могут использовать эту функцию
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) THEN
    RETURN false;
  END IF;

  UPDATE public.profiles
  SET force_logout = true
  WHERE id = p_user_id;
  
  RETURN true;
END;
$function$;

-- 2. Функции валидации и проверки
CREATE OR REPLACE FUNCTION public.validate_profile_update(
  p_user_id uuid,
  p_user_type user_type,
  p_verification_status verification_status,
  p_is_trusted_seller boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Проверяем, что пользователь не пытается изменить критические поля
  IF p_user_type != (SELECT user_type FROM public.profiles WHERE id = p_user_id) THEN
    RETURN false;
  END IF;
  
  IF p_verification_status != (SELECT verification_status FROM public.profiles WHERE id = p_user_id) THEN
    RETURN false;
  END IF;
  
  IF p_is_trusted_seller != (SELECT is_trusted_seller FROM public.profiles WHERE id = p_user_id) THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_order_number_unique(p_order_number integer, p_order_id uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Verify the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only administrators can use this function';
  END IF;

  -- Check if order number exists (excluding current order if updating)
  IF p_order_id IS NOT NULL THEN
    RETURN NOT EXISTS (
      SELECT 1 FROM public.orders 
      WHERE order_number = p_order_number 
      AND id != p_order_id
    );
  ELSE
    RETURN NOT EXISTS (
      SELECT 1 FROM public.orders 
      WHERE order_number = p_order_number
    );
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_user_pending_offer(p_user_id uuid, p_product_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.price_offers 
    WHERE buyer_id = p_user_id 
    AND product_id = p_product_id 
    AND status = 'pending'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_rate_limit(p_user_id uuid, p_action text, p_limit_per_hour integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  action_count integer;
BEGIN
  -- Подсчитываем количество действий за последний час
  SELECT COUNT(*) INTO action_count
  FROM public.event_logs
  WHERE user_id = p_user_id
  AND action_type = p_action
  AND created_at > NOW() - INTERVAL '1 hour';
  
  RETURN action_count < p_limit_per_hour;
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_search_rate_limit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN check_rate_limit(p_user_id, 'search', 100); -- 100 поисков в час
END;
$function$;

CREATE OR REPLACE FUNCTION public.check_user_auth_method(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN COALESCE(
    (SELECT auth_method FROM public.profiles WHERE id = p_user_id),
    'email'
  );
END;
$function$;

-- 3. Функции управления метриками
CREATE OR REPLACE FUNCTION public.get_admin_metrics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'pending_users', (SELECT COUNT(*) FROM public.profiles WHERE verification_status = 'pending'),
    'total_products', (SELECT COUNT(*) FROM public.products),
    'pending_products', (SELECT COUNT(*) FROM public.products WHERE status = 'pending'),
    'total_orders', (SELECT COUNT(*) FROM public.orders),
    'non_processed_orders', (SELECT COUNT(*) FROM public.orders WHERE status != 'processed')
  ) INTO result;
  
  RETURN result;
END;
$function$;