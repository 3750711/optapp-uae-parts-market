
-- Create custom email verification system

-- Create email verification codes table
CREATE TABLE public.email_verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  ip_address INET
);

-- Add email_confirmed field to profiles for easy access
ALTER TABLE public.profiles 
ADD COLUMN email_confirmed BOOLEAN DEFAULT FALSE;

-- Create index for performance
CREATE INDEX idx_email_verification_codes_email_code ON public.email_verification_codes(email, code);
CREATE INDEX idx_email_verification_codes_expires ON public.email_verification_codes(expires_at);

-- RLS policies for email_verification_codes
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System manages email verification codes" ON public.email_verification_codes
FOR ALL USING (false) WITH CHECK (false);

-- Function to send email verification code
CREATE OR REPLACE FUNCTION public.send_email_verification_code(
  p_email TEXT,
  p_ip_address INET DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code TEXT;
  v_recent_count INTEGER;
  v_user_exists BOOLEAN;
BEGIN
  -- Check if user exists
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE email = p_email
  ) INTO v_user_exists;
  
  IF NOT v_user_exists THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Пользователь с таким email не найден'
    );
  END IF;
  
  -- Rate limiting: max 3 codes per hour per email
  SELECT COUNT(*) INTO v_recent_count
  FROM public.email_verification_codes
  WHERE email = p_email 
    AND created_at > NOW() - INTERVAL '1 hour';
    
  IF v_recent_count >= 3 THEN
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
    p_email,
    v_code,
    NOW() + INTERVAL '5 minutes',
    p_ip_address
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Код отправлен на email',
    'code', v_code -- Only for Edge Function
  );
END;
$$;

-- Function to verify email verification code
CREATE OR REPLACE FUNCTION public.verify_email_verification_code(
  p_email TEXT,
  p_code TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record RECORD;
  v_user_id UUID;
BEGIN
  -- Find valid code
  SELECT * INTO v_record
  FROM public.email_verification_codes
  WHERE email = p_email 
    AND code = p_code 
    AND used = false
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Неверный или истекший код'
    );
  END IF;
  
  -- Mark code as used
  UPDATE public.email_verification_codes
  SET used = true
  WHERE id = v_record.id;
  
  -- Get user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Пользователь не найден'
    );
  END IF;
  
  -- Update auth.users.email_confirmed_at
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = v_user_id;
  
  -- Update profiles.email_confirmed
  UPDATE public.profiles
  SET email_confirmed = true
  WHERE id = v_user_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Email успешно подтвержден'
  );
END;
$$;

-- Trigger to sync email_confirmed status
CREATE OR REPLACE FUNCTION public.sync_email_confirmed_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update profiles when auth.users.email_confirmed_at changes
  IF OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at THEN
    UPDATE public.profiles
    SET email_confirmed = (NEW.email_confirmed_at IS NOT NULL)
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS sync_email_confirmed_trigger ON auth.users;
CREATE TRIGGER sync_email_confirmed_trigger
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_email_confirmed_status();

-- Update existing profiles with current email confirmation status
UPDATE public.profiles 
SET email_confirmed = (
  SELECT email_confirmed_at IS NOT NULL 
  FROM auth.users 
  WHERE auth.users.id = profiles.id
);

-- Clean up expired codes function
CREATE OR REPLACE FUNCTION public.cleanup_expired_email_verification_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.email_verification_codes
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$;
