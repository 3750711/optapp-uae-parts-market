-- 1) Preverified emails table
CREATE TABLE IF NOT EXISTS public.preverified_emails (
  email text PRIMARY KEY,
  verified_at timestamptz NOT NULL DEFAULT now(),
  ip inet,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS and lock down access (managed only by SECURITY DEFINER functions)
ALTER TABLE public.preverified_emails ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'preverified_emails' AND policyname = 'System manages preverified emails'
  ) THEN
    CREATE POLICY "System manages preverified emails"
    ON public.preverified_emails
    FOR ALL
    USING (false)
    WITH CHECK (false);
  END IF;
END $$;

-- Helpful index (email is PK; add on verified_at for freshness checks)
CREATE INDEX IF NOT EXISTS idx_preverified_emails_verified_at
  ON public.preverified_emails (verified_at DESC);

-- 2) Update verify_email_verification_code to also upsert preverification
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
  v_headers text;
  v_ip inet;
BEGIN
  -- Attempt to extract client IP from headers (best effort)
  v_headers := current_setting('request.headers', true);
  BEGIN
    v_ip := NULLIF((v_headers::jsonb ->> 'x-forwarded-for'), '')::inet;
  EXCEPTION WHEN OTHERS THEN
    v_ip := NULL; -- ignore parse errors
  END;

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

  -- Upsert into preverified_emails
  INSERT INTO public.preverified_emails (email, verified_at, ip)
  VALUES (v_email, now(), v_ip)
  ON CONFLICT (email) DO UPDATE
  SET verified_at = EXCLUDED.verified_at,
      ip = COALESCE(EXCLUDED.ip, public.preverified_emails.ip);

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

-- 3) complete_profile_after_signup RPC
CREATE OR REPLACE FUNCTION public.complete_profile_after_signup(p_email text, payload jsonb)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_email text := lower(trim(p_email));
  v_user_id uuid := auth.uid();
  v_exists boolean := false;
  v_user_type_text text := lower(NULLIF(payload->>'user_type', ''));
  v_new_user_type public.user_type;
  v_opt_id text := NULLIF(payload->>'opt_id', '');
  v_full_name text := NULLIF(payload->>'full_name', '');
  v_phone text := NULLIF(payload->>'phone', '');
  v_company_name text := NULLIF(payload->>'company_name', '');
  v_location text := NULLIF(payload->>'location', '');
  v_accepted_terms boolean;
  v_accepted_privacy boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Пользователь не аутентифицирован');
  END IF;

  -- Check recent preverification (last 24 hours)
  SELECT true INTO v_exists
  FROM public.preverified_emails
  WHERE email = v_email
    AND verified_at > now() - interval '24 hours'
  LIMIT 1;

  IF NOT v_exists THEN
    RETURN json_build_object('success', false, 'message', 'Email не предверифицирован или срок истек');
  END IF;

  -- Allow only safe user_type values
  IF v_user_type_text IN ('buyer','seller') THEN
    v_new_user_type := v_user_type_text::public.user_type;
  ELSE
    v_new_user_type := NULL; -- keep existing
  END IF;

  -- Parse booleans safely
  BEGIN
    v_accepted_terms := (payload->>'accepted_terms')::boolean;
  EXCEPTION WHEN OTHERS THEN
    v_accepted_terms := NULL;
  END;
  BEGIN
    v_accepted_privacy := (payload->>'accepted_privacy')::boolean;
  EXCEPTION WHEN OTHERS THEN
    v_accepted_privacy := NULL;
  END;

  -- Update only current user's profile by email
  UPDATE public.profiles p
  SET 
    email_confirmed = true,
    full_name = COALESCE(v_full_name, p.full_name),
    phone = COALESCE(v_phone, p.phone),
    company_name = COALESCE(v_company_name, p.company_name),
    location = COALESCE(v_location, p.location),
    opt_id = COALESCE(v_opt_id, p.opt_id),
    user_type = COALESCE(v_new_user_type, p.user_type),
    accepted_terms = COALESCE(v_accepted_terms, p.accepted_terms),
    accepted_terms_at = CASE WHEN COALESCE(v_accepted_terms, false) THEN now() ELSE p.accepted_terms_at END,
    accepted_privacy = COALESCE(v_accepted_privacy, p.accepted_privacy),
    accepted_privacy_at = CASE WHEN COALESCE(v_accepted_privacy, false) THEN now() ELSE p.accepted_privacy_at END
  WHERE p.id = v_user_id AND lower(p.email) = v_email;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Профиль не найден для текущего пользователя');
  END IF;

  RETURN json_build_object('success', true, 'message', 'Профиль обновлен');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', 'Ошибка при обновлении профиля');
END;
$$;