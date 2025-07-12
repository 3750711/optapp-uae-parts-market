-- Add Telegram authentication fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN telegram_id BIGINT UNIQUE,
ADD COLUMN telegram_username TEXT,
ADD COLUMN telegram_first_name TEXT,
ADD COLUMN telegram_photo_url TEXT,
ADD COLUMN auth_method TEXT DEFAULT 'email' CHECK (auth_method IN ('email', 'telegram', 'both')),
ADD COLUMN profile_completed BOOLEAN DEFAULT true;

-- Create index for fast Telegram ID lookups
CREATE INDEX idx_profiles_telegram_id ON public.profiles(telegram_id) WHERE telegram_id IS NOT NULL;

-- Update existing users to have email as auth method
UPDATE public.profiles SET auth_method = 'email' WHERE auth_method IS NULL;

-- Create function to handle Telegram user creation/update
CREATE OR REPLACE FUNCTION public.handle_telegram_auth(
  p_telegram_id BIGINT,
  p_telegram_username TEXT,
  p_telegram_first_name TEXT,
  p_telegram_photo_url TEXT,
  p_email TEXT DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  auth_user_id UUID;
  profile_exists BOOLEAN := false;
BEGIN
  -- Check if user already exists by telegram_id
  SELECT * INTO user_record
  FROM public.profiles
  WHERE telegram_id = p_telegram_id;
  
  IF FOUND THEN
    -- Update existing user
    UPDATE public.profiles
    SET 
      telegram_username = p_telegram_username,
      telegram_first_name = p_telegram_first_name,
      telegram_photo_url = p_telegram_photo_url,
      auth_method = CASE 
        WHEN auth_method = 'email' THEN 'both'
        ELSE auth_method
      END
    WHERE telegram_id = p_telegram_id;
    
    RETURN json_build_object(
      'success', true,
      'user_exists', true,
      'user_id', user_record.id,
      'profile_completed', user_record.profile_completed,
      'message', 'User updated successfully'
    );
  ELSE
    -- Create new user with temporary email if not provided
    IF p_email IS NULL THEN
      p_email := 'telegram_' || p_telegram_id || '@temp.local';
    END IF;
    
    -- Generate a UUID for the new user
    auth_user_id := gen_random_uuid();
    
    -- Insert new profile
    INSERT INTO public.profiles (
      id,
      email,
      telegram_id,
      telegram_username,
      telegram_first_name,
      telegram_photo_url,
      full_name,
      auth_method,
      profile_completed
    ) VALUES (
      auth_user_id,
      p_email,
      p_telegram_id,
      p_telegram_username,
      p_telegram_first_name,
      p_telegram_photo_url,
      p_telegram_first_name,
      'telegram',
      false
    );
    
    RETURN json_build_object(
      'success', true,
      'user_exists', false,
      'user_id', auth_user_id,
      'profile_completed', false,
      'message', 'New user created successfully'
    );
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Error: ' || SQLERRM
    );
END;
$$;