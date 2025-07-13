-- Update handle_new_user trigger to set profile_completed = true only when all required fields are present
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
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
  )
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'auth_method', 'email'),
    -- Set profile_completed = true only if we have full_name and user_type from metadata
    CASE 
      WHEN NEW.raw_user_meta_data->>'auth_method' = 'telegram' 
           AND NEW.raw_user_meta_data->>'full_name' IS NOT NULL 
           AND NEW.raw_user_meta_data->>'user_type' IS NOT NULL
      THEN true
      WHEN NEW.raw_user_meta_data->>'auth_method' = 'telegram' 
      THEN false
      ELSE true
    END,
    NEW.raw_user_meta_data->>'full_name',
    CASE 
      WHEN NEW.raw_user_meta_data->>'user_type' = 'buyer' THEN 'buyer'::user_type
      WHEN NEW.raw_user_meta_data->>'user_type' = 'seller' THEN 'seller'::user_type
      ELSE 'buyer'::user_type
    END,
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
        user_type = CASE 
          WHEN NEW.raw_user_meta_data->>'user_type' = 'buyer' THEN 'buyer'::user_type
          WHEN NEW.raw_user_meta_data->>'user_type' = 'seller' THEN 'seller'::user_type
          ELSE user_type
        END,
        auth_method = 'telegram',
        -- Update profile_completed based on whether we have all required data
        profile_completed = CASE 
          WHEN NEW.raw_user_meta_data->>'full_name' IS NOT NULL 
               AND NEW.raw_user_meta_data->>'user_type' IS NOT NULL
          THEN true
          ELSE profile_completed
        END
      WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$function$;