-- Ensure the handle_new_user function exists and works correctly for Telegram auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    auth_method, 
    profile_completed,
    telegram_id,
    telegram_username,
    telegram_first_name,
    telegram_photo_url
  )
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'auth_method', 'email'),
    CASE 
      WHEN NEW.raw_user_meta_data->>'auth_method' = 'telegram' THEN false
      ELSE true
    END,
    CASE 
      WHEN NEW.raw_user_meta_data->>'auth_method' = 'telegram' 
      THEN (NEW.raw_user_meta_data->>'telegram_id')::bigint
      ELSE NULL
    END,
    CASE 
      WHEN NEW.raw_user_meta_data->>'auth_method' = 'telegram' 
      THEN NEW.raw_user_meta_data->>'telegram_username'
      ELSE NULL
    END,
    CASE 
      WHEN NEW.raw_user_meta_data->>'auth_method' = 'telegram' 
      THEN NEW.raw_user_meta_data->>'telegram_first_name'
      ELSE NULL
    END,
    CASE 
      WHEN NEW.raw_user_meta_data->>'auth_method' = 'telegram' 
      THEN NEW.raw_user_meta_data->>'telegram_photo_url'
      ELSE NULL
    END
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, update it with Telegram data if needed
    UPDATE public.profiles SET
      telegram_id = CASE 
        WHEN NEW.raw_user_meta_data->>'auth_method' = 'telegram' 
        THEN (NEW.raw_user_meta_data->>'telegram_id')::bigint
        ELSE telegram_id
      END,
      telegram_username = CASE 
        WHEN NEW.raw_user_meta_data->>'auth_method' = 'telegram' 
        THEN NEW.raw_user_meta_data->>'telegram_username'
        ELSE telegram_username
      END,
      telegram_first_name = CASE 
        WHEN NEW.raw_user_meta_data->>'auth_method' = 'telegram' 
        THEN NEW.raw_user_meta_data->>'telegram_first_name'
        ELSE telegram_first_name
      END,
      telegram_photo_url = CASE 
        WHEN NEW.raw_user_meta_data->>'auth_method' = 'telegram' 
        THEN NEW.raw_user_meta_data->>'telegram_photo_url'
        ELSE telegram_photo_url
      END,
      auth_method = COALESCE(NEW.raw_user_meta_data->>'auth_method', auth_method),
      profile_completed = CASE 
        WHEN NEW.raw_user_meta_data->>'auth_method' = 'telegram' THEN false
        ELSE profile_completed
      END
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add logging for debugging
CREATE OR REPLACE FUNCTION public.log_telegram_auth_debug(user_id uuid, debug_info jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.event_logs (
    action_type,
    entity_type,
    entity_id,
    user_id,
    details
  ) VALUES (
    'telegram_auth_debug',
    'user',
    user_id,
    user_id,
    debug_info
  );
END;
$$;