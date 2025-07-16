-- Fix the handle_new_user trigger to handle type casting properly
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
  )
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'auth_method', 'email'),
    CASE 
      WHEN NEW.raw_user_meta_data->>'auth_method' = 'telegram' THEN true
      ELSE true
    END,
    NEW.raw_user_meta_data->>'full_name',
    -- Simplified user_type handling without complex casting
    CASE 
      WHEN NEW.raw_user_meta_data->>'user_type' = 'buyer' THEN 'buyer'::user_type
      WHEN NEW.raw_user_meta_data->>'user_type' = 'seller' THEN 'seller'::user_type  
      WHEN NEW.raw_user_meta_data->>'user_type' = 'admin' THEN 'admin'::user_type
      ELSE 'buyer'::user_type
    END,
    -- Simplified telegram_id handling
    CASE 
      WHEN NEW.raw_user_meta_data->>'telegram_id' IS NOT NULL 
        AND NEW.raw_user_meta_data->>'telegram_id' ~ '^[0-9]+$'
      THEN (NEW.raw_user_meta_data->>'telegram_id')::bigint 
      ELSE NULL 
    END,
    NEW.raw_user_meta_data->>'telegram_username',
    NEW.raw_user_meta_data->>'telegram_first_name',
    NEW.raw_user_meta_data->>'telegram_photo_url',
    NEW.raw_user_meta_data->>'telegram_photo_url'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, try to update it
    UPDATE public.profiles SET
      auth_method = COALESCE(NEW.raw_user_meta_data->>'auth_method', auth_method),
      telegram_id = CASE 
        WHEN NEW.raw_user_meta_data->>'telegram_id' IS NOT NULL 
          AND NEW.raw_user_meta_data->>'telegram_id' ~ '^[0-9]+$'
        THEN (NEW.raw_user_meta_data->>'telegram_id')::bigint 
        ELSE telegram_id 
      END,
      telegram_username = COALESCE(NEW.raw_user_meta_data->>'telegram_username', telegram_username),
      telegram_first_name = COALESCE(NEW.raw_user_meta_data->>'telegram_first_name', telegram_first_name),
      telegram_photo_url = COALESCE(NEW.raw_user_meta_data->>'telegram_photo_url', telegram_photo_url),
      avatar_url = COALESCE(NEW.raw_user_meta_data->>'telegram_photo_url', avatar_url),
      full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
      profile_completed = CASE 
        WHEN NEW.raw_user_meta_data->>'auth_method' = 'telegram' THEN true
        ELSE profile_completed
      END
    WHERE id = NEW.id;
    
    RETURN NEW;
  WHEN others THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error in handle_new_user: %, SQLSTATE: %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;