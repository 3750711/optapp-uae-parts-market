-- Improve error handling in handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Log the user creation attempt for debugging
  RAISE LOG 'Creating profile for user: %, metadata: %', NEW.id, NEW.raw_user_meta_data;
  
  -- Insert profile with better error handling
  INSERT INTO public.profiles (
    id, 
    full_name, 
    email,
    phone,
    telegram,
    user_type,
    auth_method,
    telegram_id
  )
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name', 
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'telegram',
    CASE 
      WHEN NEW.raw_user_meta_data->>'user_type' IS NOT NULL THEN 
        (NEW.raw_user_meta_data->>'user_type')::public.user_type
      ELSE 
        'buyer'::public.user_type
    END,
    COALESCE(NEW.raw_user_meta_data->>'auth_method', 'email'),
    CASE 
      WHEN NEW.raw_user_meta_data->>'telegram_id' IS NOT NULL THEN 
        (NEW.raw_user_meta_data->>'telegram_id')::bigint
      ELSE 
        NULL
    END
  );
  
  RAISE LOG 'Successfully created profile for user: %', NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error creating profile for user %: %, SQLSTATE: %', NEW.id, SQLERRM, SQLSTATE;
    -- Re-raise the error to prevent user creation if profile creation fails
    RAISE;
END;
$$;