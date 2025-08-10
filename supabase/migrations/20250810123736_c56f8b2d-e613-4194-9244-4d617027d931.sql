-- Ensure verify_email_verification_code validates codes from email_verification_codes only
CREATE OR REPLACE FUNCTION public.verify_email_verification_code(p_email text, p_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_record RECORD;
  v_email text := lower(trim(p_email));
  v_code text := trim(p_code);
BEGIN
  -- Find latest valid, unused code for this email
  SELECT evc.*
  INTO v_record
  FROM public.email_verification_codes evc
  WHERE lower(evc.email) = v_email
    AND evc.code = v_code
    AND COALESCE(evc.used, false) = false
    AND evc.expires_at > now()
  ORDER BY evc.created_at DESC
  LIMIT 1;

  IF v_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Неверный или истекший код'
    );
  END IF;

  -- Mark the code as used
  UPDATE public.email_verification_codes
  SET used = true
  WHERE id = v_record.id;

  RETURN json_build_object(
    'success', true,
    'message', 'Email подтвержден'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Ошибка при проверке кода'
    );
END;
$$;

-- Helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_ver_codes_expires_at
  ON public.email_verification_codes (expires_at);

CREATE INDEX IF NOT EXISTS idx_email_ver_codes_email_code
  ON public.email_verification_codes ((lower(email)), code);
