-- Update handle_new_user function to properly handle Telegram metadata
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
    full_name,
    telegram_id,
    telegram_username,
    telegram_first_name,
    telegram_photo_url,
    avatar_url
  )
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'auth_method', 'email'),
    CASE 
      WHEN NEW.raw_user_meta_data->>'auth_method' = 'telegram' THEN false
      ELSE true
    END,
    NEW.raw_user_meta_data->>'full_name',
    CASE 
      WHEN NEW.raw_user_meta_data->>'telegram_id' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'telegram_id')::bigint
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'telegram_username',
    NEW.raw_user_meta_data->>'telegram_first_name',
    NEW.raw_user_meta_data->>'photo_url',
    NEW.raw_user_meta_data->>'photo_url'
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, update with Telegram data if provided
    IF NEW.raw_user_meta_data->>'auth_method' = 'telegram' THEN
      UPDATE public.profiles
      SET 
        telegram_id = CASE 
          WHEN NEW.raw_user_meta_data->>'telegram_id' IS NOT NULL 
          THEN (NEW.raw_user_meta_data->>'telegram_id')::bigint
          ELSE telegram_id
        END,
        telegram_username = COALESCE(NEW.raw_user_meta_data->>'telegram_username', telegram_username),
        telegram_first_name = COALESCE(NEW.raw_user_meta_data->>'telegram_first_name', telegram_first_name),
        telegram_photo_url = COALESCE(NEW.raw_user_meta_data->>'photo_url', telegram_photo_url),
        avatar_url = COALESCE(NEW.raw_user_meta_data->>'photo_url', avatar_url),
        full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
        auth_method = 'telegram'
      WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;