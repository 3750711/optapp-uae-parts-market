-- Simplify handle_new_user function to basic profile creation
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
    full_name,
    telegram_id,
    telegram,
    avatar_url,
    user_type
  ) VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'auth_method', 'email'),
    NEW.raw_user_meta_data->>'full_name',
    CASE 
      WHEN NEW.raw_user_meta_data->>'telegram_id' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'telegram_id')::bigint
      ELSE NULL
    END,
    NEW.raw_user_meta_data->>'telegram',
    NEW.raw_user_meta_data->>'photo_url',
    COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'buyer'::user_type)
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, basic update for Telegram users
    IF NEW.raw_user_meta_data->>'auth_method' = 'telegram' THEN
      UPDATE public.profiles
      SET 
        auth_method = 'telegram',
        telegram_id = CASE 
          WHEN NEW.raw_user_meta_data->>'telegram_id' IS NOT NULL 
          THEN (NEW.raw_user_meta_data->>'telegram_id')::bigint
          ELSE telegram_id
        END,
        telegram = NEW.raw_user_meta_data->>'telegram',
        avatar_url = COALESCE(NEW.raw_user_meta_data->>'photo_url', avatar_url),
        full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name)
      WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;