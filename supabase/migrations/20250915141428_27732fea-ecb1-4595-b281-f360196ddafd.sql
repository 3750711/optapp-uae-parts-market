-- Удаляем старую версию log_security_event и создаем правильную
DROP FUNCTION IF EXISTS public.log_security_event(text, uuid, inet, text, jsonb);

-- Создаем правильную функцию log_security_event с правильными параметрами
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action text, 
  p_user_id uuid DEFAULT NULL::uuid, 
  p_ip_address inet DEFAULT NULL::inet, 
  p_user_agent text DEFAULT NULL::text, 
  p_error_message text DEFAULT NULL::text,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO public.security_logs (
    action,
    user_id,
    ip_address,
    user_agent,
    error_message,
    metadata
  ) VALUES (
    p_action,
    p_user_id,
    p_ip_address,
    p_user_agent,
    p_error_message,
    p_details
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in log_security_event: %', SQLERRM;
    RAISE;
END;
$function$;