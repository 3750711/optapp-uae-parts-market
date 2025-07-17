-- Create a secure function to check user auth method by email or OPT ID
CREATE OR REPLACE FUNCTION public.check_user_auth_method(p_login_input text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email text;
  auth_method_result text;
BEGIN
  -- First, determine if input is email or OPT ID and get the email
  IF p_login_input ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    -- Input is an email
    user_email := p_login_input;
  ELSE
    -- Input is OPT ID, get email from profiles
    SELECT email INTO user_email
    FROM public.profiles
    WHERE opt_id = p_login_input
    LIMIT 1;
  END IF;
  
  -- If no email found, return null
  IF user_email IS NULL THEN
    RETURN json_build_object('auth_method', null);
  END IF;
  
  -- Get auth method for the email
  SELECT auth_method INTO auth_method_result
  FROM public.profiles
  WHERE email = user_email
  LIMIT 1;
  
  RETURN json_build_object('auth_method', auth_method_result);
END;
$$;