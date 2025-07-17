-- Remove dependency on auth.users trigger and create missing profiles for existing Telegram users
-- Handle duplicate telegram_id constraint safely

-- First, drop the trigger that won't work on auth.users in Supabase
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create missing profiles for existing Telegram users who don't have profiles
-- Handle duplicate telegram_id by updating existing profiles instead
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
    -- Try to insert, but if telegram_id already exists, skip
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
    )
    ON CONFLICT (id) DO NOTHING
    ON CONFLICT (telegram_id) DO NOTHING;
  END LOOP;
END $$;