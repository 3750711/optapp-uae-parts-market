-- First, let's update the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Log the trigger execution
  RAISE LOG 'handle_new_user triggered for user: %', NEW.id;
  
  BEGIN
    -- Insert into profiles with proper error handling
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
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'auth_method', 'email'),
      CASE 
        WHEN NEW.raw_user_meta_data->>'auth_method' = 'telegram' THEN true
        ELSE false
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
    
    RAISE LOG 'Successfully created profile for user: %', NEW.id;
    
  EXCEPTION
    WHEN unique_violation THEN
      -- Profile already exists, update with Telegram data if auth_method is telegram
      IF NEW.raw_user_meta_data->>'auth_method' = 'telegram' THEN
        UPDATE public.profiles SET
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
          auth_method = 'telegram',
          profile_completed = true
        WHERE id = NEW.id;
        
        RAISE LOG 'Updated existing profile with Telegram data for user: %', NEW.id;
      END IF;
    
    WHEN OTHERS THEN
      RAISE LOG 'Error in handle_new_user for user %: % %', NEW.id, SQLSTATE, SQLERRM;
      -- Don't re-raise the error as it would block auth
  END;
  
  RETURN NEW;
END;
$$;