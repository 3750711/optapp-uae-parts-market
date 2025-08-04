-- Fix the handle_new_user function to use fully qualified type names
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Log the trigger execution
  RAISE LOG 'Creating profile for new user: %', NEW.id;
  RAISE LOG 'User meta data: %', NEW.raw_user_meta_data;
  
  BEGIN
    -- Create profile for new user with proper type casting using fully qualified names
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      auth_method,
      telegram_id,
      telegram,
      avatar_url,
      profile_completed,
      user_type,
      verification_status,
      email_confirmed
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'auth_method', 'email'),
      CASE 
        WHEN NEW.raw_user_meta_data ->> 'telegram_id' IS NOT NULL 
        THEN (NEW.raw_user_meta_data ->> 'telegram_id')::bigint 
        ELSE NULL 
      END,
      COALESCE(NEW.raw_user_meta_data ->> 'telegram', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'photo_url', ''),
      COALESCE((NEW.raw_user_meta_data ->> 'profile_completed')::boolean, FALSE),
      COALESCE(NEW.raw_user_meta_data ->> 'user_type', 'buyer')::public.user_type,
      'pending'::public.verification_status,
      NEW.email_confirmed_at IS NOT NULL
    );
    
    RAISE LOG 'Successfully created profile for user: %', NEW.id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- Ensure trigger is properly attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();