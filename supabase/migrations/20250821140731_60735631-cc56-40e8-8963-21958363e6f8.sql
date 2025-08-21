-- Fix critical security issues by adding SET search_path to Security Definer functions
-- and fix the complete_profile_after_signup function logic

-- First, fix the complete_profile_after_signup function to remove the email verification requirement during signup
CREATE OR REPLACE FUNCTION public.complete_profile_after_signup(
  p_full_name TEXT,
  p_company_name TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_telegram TEXT DEFAULT NULL,
  p_user_type TEXT DEFAULT 'buyer'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  user_id UUID;
  existing_profile_id UUID;
  result JSON;
BEGIN
  -- Get current user ID
  user_id := auth.uid();
  
  -- Check if user is authenticated
  IF user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'User not authenticated'
    );
  END IF;

  -- Check if profile already exists
  SELECT id INTO existing_profile_id
  FROM public.profiles 
  WHERE id = user_id;
  
  -- If profile exists, update it
  IF existing_profile_id IS NOT NULL THEN
    UPDATE public.profiles SET
      full_name = p_full_name,
      company_name = CASE WHEN p_user_type = 'seller' THEN p_company_name ELSE NULL END,
      location = p_location,
      phone = p_phone,
      telegram = p_telegram,
      user_type = p_user_type::user_type,
      profile_completed = true,
      accepted_terms = true,
      accepted_privacy = true,
      accepted_terms_at = NOW(),
      accepted_privacy_at = NOW()
    WHERE id = user_id;
    
    RETURN json_build_object(
      'success', true,
      'message', 'Profile updated successfully'
    );
  END IF;
  
  -- Create new profile
  INSERT INTO public.profiles (
    id,
    full_name,
    company_name,
    location,
    phone,
    telegram,
    user_type,
    email,
    profile_completed,
    accepted_terms,
    accepted_privacy,
    accepted_terms_at,
    accepted_privacy_at,
    auth_method
  ) VALUES (
    user_id,
    p_full_name,
    CASE WHEN p_user_type = 'seller' THEN p_company_name ELSE NULL END,
    p_location,
    p_phone,
    p_telegram,
    p_user_type::user_type,
    COALESCE(
      (SELECT email FROM auth.users WHERE id = user_id),
      'unknown@temp.com'
    ),
    true,
    true,
    true,
    NOW(),
    NOW(),
    'email'
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Profile created successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'message', 'Error creating profile: ' || SQLERRM
  );
END;
$$;

-- Fix verify_email_verification_code function
CREATE OR REPLACE FUNCTION public.verify_email_verification_code(p_email text, p_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER  
SET search_path TO ''
AS $$
DECLARE
  v_email TEXT := lower(trim(p_email));
  v_code_record RECORD;
BEGIN
  -- Find valid code
  SELECT id, expires_at, used INTO v_code_record
  FROM public.email_verification_codes
  WHERE lower(email) = v_email 
    AND code = p_code
    AND NOT used
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;
    
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Неверный или истекший код'
    );
  END IF;
  
  -- Mark code as used
  UPDATE public.email_verification_codes
  SET used = true
  WHERE id = v_code_record.id;
  
  -- Add to preverified emails for future reference
  INSERT INTO public.preverified_emails (email, verified_at)
  VALUES (v_email, NOW())
  ON CONFLICT (email) DO UPDATE SET
    verified_at = NOW();
  
  RETURN json_build_object(
    'success', true,
    'message', 'Email успешно подтвержден'
  );
END;
$$;

-- Fix send_email_verification_code function  
CREATE OR REPLACE FUNCTION public.send_email_verification_code(p_email text, p_ip_address inet DEFAULT NULL::inet)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
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
$$;

-- Fix other critical Security Definer functions by adding SET search_path
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path TO ''
AS $$
  SELECT COALESCE(
    (SELECT user_type = 'admin' 
     FROM public.profiles 
     WHERE id = auth.uid()),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path TO ''
AS $$
  SELECT auth.uid();
$$;