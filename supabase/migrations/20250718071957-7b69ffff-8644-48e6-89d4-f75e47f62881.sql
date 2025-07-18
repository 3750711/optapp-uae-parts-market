-- Improve handle_new_user function to safely handle both Telegram and email registration
-- Fix the enum type reference issue
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  auth_method_value text;
  user_type_value text;
  email_value text;
  full_name_value text;
  telegram_value text;
  telegram_id_value bigint;
  avatar_url_value text;
BEGIN
  -- Log the trigger execution for debugging
  RAISE LOG 'handle_new_user triggered for user: %, metadata: %', NEW.id, NEW.raw_user_meta_data;

  -- Extract values from metadata with fallbacks
  auth_method_value := COALESCE(NEW.raw_user_meta_data->>'auth_method', 'email');
  email_value := COALESCE(NEW.email, '');
  
  -- Handle user_type safely without enum casting in the variable declaration
  user_type_value := COALESCE(NEW.raw_user_meta_data->>'user_type', 'buyer');

  -- Extract other fields
  full_name_value := NEW.raw_user_meta_data->>'full_name';
  telegram_value := NEW.raw_user_meta_data->>'telegram';
  avatar_url_value := NEW.raw_user_meta_data->>'photo_url';
  
  -- Handle telegram_id with safe casting
  BEGIN
    IF NEW.raw_user_meta_data->>'telegram_id' IS NOT NULL THEN
      telegram_id_value := (NEW.raw_user_meta_data->>'telegram_id')::bigint;
    ELSE
      telegram_id_value := NULL;
    END IF;
  EXCEPTION
    WHEN others THEN
      telegram_id_value := NULL;
  END;

  -- Insert profile with all available data
  INSERT INTO public.profiles (
    id, 
    email, 
    auth_method,
    full_name,
    telegram_id,
    telegram,
    avatar_url,
    user_type,
    email_confirmed,
    profile_completed
  ) VALUES (
    NEW.id, 
    email_value,
    auth_method_value,
    full_name_value,
    telegram_id_value,
    telegram_value,
    avatar_url_value,
    user_type_value::user_type,  -- Cast to enum only during insertion
    -- Auto-confirm email for Telegram users
    CASE WHEN auth_method_value = 'telegram' THEN true ELSE false END,
    -- Consider profile completed for Telegram users if they have full_name
    CASE 
      WHEN auth_method_value = 'telegram' AND full_name_value IS NOT NULL THEN true 
      ELSE false 
    END
  );
  
  RAISE LOG 'Profile created successfully for user: % with auth_method: %', NEW.id, auth_method_value;
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, update it for Telegram users only
    IF auth_method_value = 'telegram' THEN
      RAISE LOG 'Profile exists, updating for Telegram user: %', NEW.id;
      UPDATE public.profiles
      SET 
        auth_method = auth_method_value,
        telegram_id = COALESCE(telegram_id_value, telegram_id),
        telegram = COALESCE(telegram_value, telegram),
        avatar_url = COALESCE(avatar_url_value, avatar_url),
        full_name = COALESCE(full_name_value, full_name),
        email_confirmed = true
      WHERE id = NEW.id;
    ELSE
      RAISE LOG 'Profile exists for non-Telegram user: %, skipping update', NEW.id;
    END IF;
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user for user %: %, SQLSTATE: %', NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;