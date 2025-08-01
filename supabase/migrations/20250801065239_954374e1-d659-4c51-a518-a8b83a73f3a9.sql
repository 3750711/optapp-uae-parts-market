-- Фаза 1: Критичные функции безопасности - исправление ошибок
-- Сначала удаляем проблемные функции, затем создаем заново

-- Удаляем функции с конфликтами типов
DROP FUNCTION IF EXISTS public.check_user_not_blocked();
DROP FUNCTION IF EXISTS public.check_force_logout_status();
DROP FUNCTION IF EXISTS public.force_user_logout(uuid);
DROP FUNCTION IF EXISTS public.validate_profile_update(uuid, user_type, verification_status, boolean);
DROP FUNCTION IF EXISTS public.check_user_pending_offer(uuid, uuid);
DROP FUNCTION IF EXISTS public.check_rate_limit(uuid, text, integer);
DROP FUNCTION IF EXISTS public.check_search_rate_limit(uuid);
DROP FUNCTION IF EXISTS public.check_user_auth_method(uuid);

-- Теперь создаем функции заново с правильной защитой
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

CREATE FUNCTION public.check_user_not_blocked()
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

CREATE FUNCTION public.check_force_logout_status()
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

CREATE FUNCTION public.force_user_logout(p_user_id uuid)
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

CREATE FUNCTION public.validate_profile_update(
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

CREATE FUNCTION public.check_user_pending_offer(p_user_id uuid, p_product_id uuid)
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

CREATE FUNCTION public.check_rate_limit(p_user_id uuid, p_action text, p_limit_per_hour integer)
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

CREATE FUNCTION public.check_search_rate_limit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN check_rate_limit(p_user_id, 'search', 100); -- 100 поисков в час
END;
$function$;

CREATE FUNCTION public.check_user_auth_method(p_user_id uuid)
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