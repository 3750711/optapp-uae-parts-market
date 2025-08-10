-- Relax rate limit: allow up to 10 codes per hour per email
CREATE OR REPLACE FUNCTION public.send_email_verification_code(p_email text, p_ip_address inet DEFAULT NULL::inet)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_code TEXT;
  v_recent_count INTEGER;
  v_email TEXT := lower(trim(p_email));
BEGIN
  -- Rate limiting: max 10 codes per hour per email
  SELECT COUNT(*) INTO v_recent_count
  FROM public.email_verification_codes
  WHERE lower(email) = v_email 
    AND created_at > NOW() - INTERVAL '1 hour';
    
  IF v_recent_count >= 10 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Слишком много попыток. Попробуйте через час.'
    );
  END IF;
  
  -- Generate 6-digit code
  v_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  
  -- Insert new verification code
  INSERT INTO public.email_verification_codes (
    email, 
    code, 
    expires_at, 
    ip_address
  ) VALUES (
    v_email,
    v_code,
    NOW() + INTERVAL '5 minutes',
    p_ip_address
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Код отправлен на email',
    'code', v_code
  );
END;
$function$