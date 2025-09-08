-- Migration: Fix Authentication Issues - User Data Sync and First Login Logic
-- This migration addresses token invalidation, user data synchronization, and first login completion

-- 1. Sync user_type between auth.users.raw_user_meta_data and profiles table
UPDATE public.profiles 
SET user_type = (
  CASE 
    WHEN auth_users.raw_user_meta_data->>'user_type' = 'admin' THEN 'admin'::user_type
    WHEN auth_users.raw_user_meta_data->>'user_type' = 'seller' THEN 'seller'::user_type  
    WHEN auth_users.raw_user_meta_data->>'user_type' = 'buyer' THEN 'buyer'::user_type
    ELSE profiles.user_type  -- Keep existing value if meta_data is invalid
  END
)
FROM auth.users auth_users
WHERE profiles.id = auth_users.id 
  AND auth_users.raw_user_meta_data->>'user_type' IS NOT NULL
  AND profiles.user_type != (auth_users.raw_user_meta_data->>'user_type')::user_type;

-- 2. Set first_login_completed = true for users who already have complete profiles
UPDATE public.profiles 
SET first_login_completed = true
WHERE first_login_completed = false 
  AND full_name IS NOT NULL 
  AND email IS NOT NULL 
  AND user_type IS NOT NULL;

-- 3. Create function to sync user metadata with profiles on auth changes
CREATE OR REPLACE FUNCTION public.sync_auth_metadata_to_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only sync if profile exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    UPDATE public.profiles
    SET 
      user_type = COALESCE(
        (NEW.raw_user_meta_data->>'user_type')::user_type, 
        user_type
      ),
      email = COALESCE(NEW.email, email),
      -- Mark first_login_completed as false for new Telegram users
      first_login_completed = CASE 
        WHEN NEW.raw_user_meta_data->>'auth_provider' = 'telegram' 
         AND OLD.raw_user_meta_data->>'auth_provider' IS DISTINCT FROM 'telegram' 
        THEN false
        ELSE first_login_completed
      END
    WHERE id = NEW.id;
  ELSE
    -- Create profile if it doesn't exist (safety fallback)
    INSERT INTO public.profiles (
      id, 
      email, 
      user_type, 
      auth_method,
      first_login_completed,
      profile_completed
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'buyer'::user_type),
      COALESCE(NEW.raw_user_meta_data->>'auth_provider', 'email'),
      CASE WHEN NEW.raw_user_meta_data->>'auth_provider' = 'telegram' THEN false ELSE true END,
      CASE WHEN NEW.raw_user_meta_data->>'auth_provider' = 'telegram' THEN false ELSE true END
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Create trigger to sync auth.users changes to profiles
DROP TRIGGER IF EXISTS on_auth_user_metadata_sync ON auth.users;
CREATE TRIGGER on_auth_user_metadata_sync
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data OR OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.sync_auth_metadata_to_profile();

-- 5. Create function to handle profile completion
CREATE OR REPLACE FUNCTION public.complete_first_login_setup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-complete first login when profile has essential data
  IF NEW.first_login_completed = false 
     AND NEW.full_name IS NOT NULL 
     AND NEW.email IS NOT NULL 
     AND NEW.user_type IS NOT NULL THEN
    NEW.first_login_completed = true;
    NEW.profile_completed = true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 6. Create trigger for profile completion logic
DROP TRIGGER IF EXISTS on_profile_completion_check ON public.profiles;
CREATE TRIGGER on_profile_completion_check
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.complete_first_login_setup();

-- 7. Create diagnostic function for auth state
CREATE OR REPLACE FUNCTION public.diagnose_auth_state(p_user_id uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  auth_data record;
  profile_data record;
  diagnostics jsonb;
BEGIN
  -- Get auth.users data
  SELECT 
    id, email, created_at, updated_at, 
    raw_user_meta_data, user_metadata,
    email_confirmed_at IS NOT NULL as email_confirmed
  INTO auth_data
  FROM auth.users
  WHERE id = p_user_id;
  
  -- Get profile data
  SELECT * INTO profile_data
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Build diagnostic response
  diagnostics := jsonb_build_object(
    'user_id', p_user_id,
    'timestamp', now(),
    'auth_exists', auth_data.id IS NOT NULL,
    'profile_exists', profile_data.id IS NOT NULL,
    'email_confirmed', auth_data.email_confirmed,
    'auth_email', auth_data.email,
    'profile_email', profile_data.email,
    'auth_user_type', auth_data.raw_user_meta_data->>'user_type',
    'profile_user_type', profile_data.user_type,
    'first_login_completed', profile_data.first_login_completed,
    'profile_completed', profile_data.profile_completed,
    'verification_status', profile_data.verification_status,
    'auth_method', profile_data.auth_method,
    'data_sync_issues', jsonb_build_object(
      'email_mismatch', auth_data.email != profile_data.email,
      'user_type_mismatch', (auth_data.raw_user_meta_data->>'user_type') != profile_data.user_type::text,
      'missing_profile', auth_data.id IS NOT NULL AND profile_data.id IS NULL
    )
  );
  
  RETURN diagnostics;
END;
$$;

-- 8. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.diagnose_auth_state(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.diagnose_auth_state() TO authenticated;