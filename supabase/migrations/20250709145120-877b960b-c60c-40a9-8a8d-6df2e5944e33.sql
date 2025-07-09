-- Make location field nullable in profiles table and update function
ALTER TABLE public.profiles ALTER COLUMN location DROP NOT NULL;

-- Update default value to be NULL instead of 'Dubai'
ALTER TABLE public.profiles ALTER COLUMN location SET DEFAULT NULL;

-- Update handle_new_user function to not set location by default
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
    COALESCE((new.raw_user_meta_data->>'user_type')::user_type, 'buyer'::user_type)
  );
  RETURN new;
END;
$$;