-- Fix handle_new_user function to use schema-qualified user_type enum
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    email,
    phone,
    telegram,
    user_type
  )
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'telegram',
    COALESCE((new.raw_user_meta_data->>'user_type')::public.user_type, 'buyer'::public.user_type)
  );
  RETURN new;
END;
$$;