-- Remove dependency on auth.users trigger and create missing profiles safely
-- Since Supabase restricts triggers on auth.users, we handle profile creation in the application

-- First, drop the trigger that won't work on auth.users in Supabase
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Simply drop the handle_new_user function since it won't work with auth.users triggers
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Now handle existing users manually
-- We'll use a safer approach that avoids the telegram_id constraint issue
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL 
    AND au.raw_user_meta_data->>'auth_method' = 'telegram'
  LOOP
    BEGIN
      -- Try to insert the profile
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
        user_record.id,
        user_record.email,
        'telegram',
        user_record.raw_user_meta_data->>'full_name',
        CASE 
          WHEN user_record.raw_user_meta_data->>'telegram_id' IS NOT NULL 
          THEN (user_record.raw_user_meta_data->>'telegram_id')::bigint
          ELSE NULL
        END,
        user_record.raw_user_meta_data->>'telegram',
        user_record.raw_user_meta_data->>'photo_url',
        COALESCE((user_record.raw_user_meta_data->>'user_type')::user_type, 'buyer'::user_type)
      );
    EXCEPTION
      WHEN unique_violation THEN
        -- If telegram_id already exists, create profile without telegram_id
        INSERT INTO public.profiles (
          id, 
          email, 
          auth_method,
          full_name,
          telegram,
          avatar_url,
          user_type
        ) VALUES (
          user_record.id,
          user_record.email,
          'telegram',
          user_record.raw_user_meta_data->>'full_name',
          user_record.raw_user_meta_data->>'telegram',
          user_record.raw_user_meta_data->>'photo_url',
          COALESCE((user_record.raw_user_meta_data->>'user_type')::user_type, 'buyer'::user_type)
        )
        ON CONFLICT (id) DO NOTHING;
    END;
  END LOOP;
END $$;