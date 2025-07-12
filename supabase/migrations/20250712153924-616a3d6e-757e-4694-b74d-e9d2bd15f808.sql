-- Remove old handle_telegram_auth function if it exists
DROP FUNCTION IF EXISTS public.handle_telegram_auth(bigint, text, text, text, text);

-- Ensure profiles trigger exists for auth user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, auth_method, profile_completed)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'auth_method', 'email'),
    CASE 
      WHEN NEW.raw_user_meta_data->>'auth_method' = 'telegram' THEN false
      ELSE true
    END
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, skip
    RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update profiles table to ensure telegram fields exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS telegram_id bigint,
ADD COLUMN IF NOT EXISTS telegram_username text,
ADD COLUMN IF NOT EXISTS telegram_first_name text,
ADD COLUMN IF NOT EXISTS telegram_photo_url text;

-- Add unique constraint on telegram_id if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_telegram_id_unique'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_telegram_id_unique UNIQUE (telegram_id);
  END IF;
END $$;