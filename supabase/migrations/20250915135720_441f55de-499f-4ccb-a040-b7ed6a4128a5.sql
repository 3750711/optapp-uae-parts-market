-- Fix critical errors in check_ip_rate_limit function
DROP FUNCTION IF EXISTS public.check_ip_rate_limit(text, text);
DROP FUNCTION IF EXISTS public.check_ip_rate_limit(inet, text);

CREATE OR REPLACE FUNCTION public.check_ip_rate_limit(
  p_ip_address inet,
  p_action text,
  p_limit integer DEFAULT 5,
  p_window_minutes integer DEFAULT 60
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_count integer;
BEGIN
  -- Count requests from this IP for this action within the time window
  SELECT COUNT(*)
  INTO request_count
  FROM public.security_logs
  WHERE ip_address = p_ip_address
    AND action = p_action
    AND created_at > (NOW() - (p_window_minutes || ' minutes')::interval);
  
  -- Check if limit exceeded
  IF request_count >= p_limit THEN
    RETURN json_build_object(
      'allowed', false,
      'count', request_count,
      'limit', p_limit,
      'reset_time', NOW() + (p_window_minutes || ' minutes')::interval
    );
  ELSE
    RETURN json_build_object(
      'allowed', true,
      'count', request_count,
      'limit', p_limit,
      'remaining', p_limit - request_count
    );
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and allow the request to proceed
    RAISE LOG 'Error in check_ip_rate_limit: %', SQLERRM;
    RETURN json_build_object(
      'allowed', true,
      'count', 0,
      'limit', p_limit,
      'error', SQLERRM
    );
END;
$$;

-- Fix log_security_event function to ensure it handles inet correctly
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action text,
  p_user_id uuid DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO public.security_logs (
    action,
    user_id,
    ip_address,
    user_agent,
    details
  ) VALUES (
    p_action,
    p_user_id,
    p_ip_address,
    p_user_agent,
    p_details
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in log_security_event: %', SQLERRM;
    RAISE;
END;
$$;

-- Create helper functions for password reset system
CREATE OR REPLACE FUNCTION public.send_password_reset_code(
  p_email text,
  p_opt_id text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code text;
  v_user_exists boolean;
BEGIN
  -- Check if user exists
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE email = p_email 
    OR (p_opt_id IS NOT NULL AND opt_id = p_opt_id)
  ) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Пользователь не найден'
    );
  END IF;
  
  -- Generate 6-digit code
  v_code := LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
  
  -- Store the code
  INSERT INTO public.password_reset_codes (
    email,
    opt_id,
    code,
    expires_at
  ) VALUES (
    p_email,
    p_opt_id,
    v_code,
    NOW() + INTERVAL '15 minutes'
  );
  
  RETURN json_build_object(
    'success', true,
    'code', v_code,
    'message', 'Код создан успешно'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in send_password_reset_code: %', SQLERRM;
    RETURN json_build_object(
      'success', false,
      'message', 'Ошибка при создании кода'
    );
END;
$$;

-- Create function to get user ID by email for password reset
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get user ID from profiles table
  SELECT id INTO v_user_id
  FROM public.profiles
  WHERE email = p_email
  LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Пользователь не найден'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'user_id', v_user_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in get_user_id_by_email: %', SQLERRM;
    RETURN json_build_object(
      'success', false,
      'message', 'Ошибка при поиске пользователя'
    );
END;
$$;