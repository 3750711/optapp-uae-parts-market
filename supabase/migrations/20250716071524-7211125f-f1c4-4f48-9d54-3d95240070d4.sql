-- Update handle_new_user function to set user_type and profile_completed for Telegram users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Insert a new profile for the new user
  INSERT INTO public.profiles (
    id,
    email,
    auth_method,
    profile_completed,
    full_name,
    user_type,
    telegram_id,
    telegram_username,
    telegram_first_name,
    telegram_photo_url,
    avatar_url
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'auth_method', 'email'),
    CASE 
      WHEN NEW.raw_user_meta_data->>'auth_method' = 'telegram' THEN true
      ELSE COALESCE(NEW.raw_user_meta_data->>'profile_completed', 'true')::boolean
    END,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'buyer')::user_type,
    CASE 
      WHEN NEW.raw_user_meta_data->>'telegram_id' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'telegram_id')::bigint 
      ELSE NULL 
    END,
    NEW.raw_user_meta_data->>'telegram_username',
    NEW.raw_user_meta_data->>'telegram_first_name',
    NEW.raw_user_meta_data->>'photo_url',
    NEW.raw_user_meta_data->>'photo_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    -- If profile already exists, update with new Telegram data
    auth_method = COALESCE(NEW.raw_user_meta_data->>'auth_method', profiles.auth_method),
    telegram_id = CASE 
      WHEN NEW.raw_user_meta_data->>'telegram_id' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'telegram_id')::bigint 
      ELSE profiles.telegram_id 
    END,
    telegram_username = COALESCE(NEW.raw_user_meta_data->>'telegram_username', profiles.telegram_username),
    telegram_first_name = COALESCE(NEW.raw_user_meta_data->>'telegram_first_name', profiles.telegram_first_name),
    telegram_photo_url = COALESCE(NEW.raw_user_meta_data->>'photo_url', profiles.telegram_photo_url),
    avatar_url = COALESCE(NEW.raw_user_meta_data->>'photo_url', profiles.avatar_url),
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', profiles.full_name),
    profile_completed = CASE 
      WHEN NEW.raw_user_meta_data->>'auth_method' = 'telegram' THEN true
      WHEN profiles.full_name IS NOT NULL AND profiles.user_type IS NOT NULL THEN true
      ELSE profiles.profile_completed
    END,
    user_type = COALESCE(NEW.raw_user_meta_data->>'user_type'::user_type, profiles.user_type, 'buyer'::user_type);

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Handle unique constraint violations gracefully
    RETURN NEW;
END;
$function$;