-- Update the handle_new_user function to correctly handle Telegram registration completion
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
    -- Set profile_completed based on auth_method and required fields
    CASE 
      WHEN NEW.raw_user_meta_data->>'auth_method' = 'telegram' THEN
        -- For Telegram users, require both full_name and user_type to mark as completed
        CASE 
          WHEN (NEW.raw_user_meta_data->>'full_name' IS NOT NULL AND 
                NEW.raw_user_meta_data->>'full_name' != '' AND
                NEW.raw_user_meta_data->>'user_type' IS NOT NULL AND
                NEW.raw_user_meta_data->>'user_type' != '') THEN true
          ELSE false
        END
      ELSE true -- Email registration is considered complete by default
    END,
    NEW.raw_user_meta_data->>'full_name',
    CASE 
      WHEN NEW.raw_user_meta_data->>'user_type' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'user_type')::user_type
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
    -- Profile already exists, update with Telegram data if applicable
    IF NEW.raw_user_meta_data->>'auth_method' = 'telegram' THEN
      UPDATE public.profiles
      SET 
        auth_method = 'telegram',
        telegram_id = CASE 
          WHEN NEW.raw_user_meta_data->>'telegram_id' IS NOT NULL 
          THEN (NEW.raw_user_meta_data->>'telegram_id')::bigint
          ELSE telegram_id
        END,
        telegram_username = NEW.raw_user_meta_data->>'telegram_username',
        telegram_first_name = NEW.raw_user_meta_data->>'telegram_first_name',
        telegram_photo_url = NEW.raw_user_meta_data->>'photo_url',
        avatar_url = COALESCE(NEW.raw_user_meta_data->>'photo_url', avatar_url),
        full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
        user_type = CASE 
          WHEN NEW.raw_user_meta_data->>'user_type' IS NOT NULL 
          THEN (NEW.raw_user_meta_data->>'user_type')::user_type
          ELSE user_type
        END,
        -- Update profile_completed based on new data
        profile_completed = CASE 
          WHEN (COALESCE(NEW.raw_user_meta_data->>'full_name', full_name) IS NOT NULL AND 
                COALESCE(NEW.raw_user_meta_data->>'full_name', full_name) != '' AND
                CASE 
                  WHEN NEW.raw_user_meta_data->>'user_type' IS NOT NULL 
                  THEN NEW.raw_user_meta_data->>'user_type'
                  ELSE user_type::text
                END IS NOT NULL) THEN true
          ELSE profile_completed
        END
      WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;