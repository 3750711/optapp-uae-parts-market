-- Restore the missing trigger for automatic profile creation
-- This is critical for Telegram auth to work properly

-- First, ensure the handle_new_user function exists and is up to date
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

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger to automatically create profiles when users are created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();