
-- This is just a reference SQL file to create the function in Supabase
-- You'll need to execute this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete the user's profile
  DELETE FROM public.profiles WHERE id = auth.uid();
  
  -- Delete the user's auth account
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
