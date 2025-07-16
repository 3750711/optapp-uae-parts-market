-- Fix the handle_new_user function to not block user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Log the attempt for debugging
  RAISE LOG 'handle_new_user: Processing user % with email %', NEW.id, NEW.email;
  RAISE LOG 'handle_new_user: Metadata: %', NEW.raw_user_meta_data;
  
  -- Try to insert profile
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
  
  RAISE LOG 'handle_new_user: Profile created successfully for user %', NEW.id;
  RETURN NEW;
  
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, log and try to update for Telegram users
    RAISE LOG 'handle_new_user: Profile already exists for user %, attempting update', NEW.id;
    
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
      
      RAISE LOG 'handle_new_user: Profile updated for Telegram user %', NEW.id;
    END IF;
    
    -- ALWAYS return NEW to allow auth user creation to proceed
    RETURN NEW;
    
  WHEN OTHERS THEN
    -- Log error but don't block auth user creation
    RAISE LOG 'handle_new_user: Error creating profile for user %: % %', NEW.id, SQLSTATE, SQLERRM;
    
    -- Still return NEW to allow the auth user to be created
    RETURN NEW;
END;
$$;