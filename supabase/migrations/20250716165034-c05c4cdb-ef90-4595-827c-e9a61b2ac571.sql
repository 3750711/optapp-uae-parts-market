-- Fix the sync function to handle duplicate telegram_id safely
CREATE OR REPLACE FUNCTION public.sync_orphaned_telegram_users_safe()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Find users in auth.users who don't have profiles but have telegram metadata
  FOR user_record IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL 
    AND au.raw_user_meta_data->>'auth_method' = 'telegram'
  LOOP
    -- Create profile for orphaned telegram user, handling potential conflicts
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
    ON CONFLICT (telegram_id) DO UPDATE SET
      -- Update the profile with the user ID if telegram_id already exists
      id = EXCLUDED.id,
      email = EXCLUDED.email,
      auth_method = EXCLUDED.auth_method,
      full_name = EXCLUDED.full_name,
      avatar_url = EXCLUDED.avatar_url,
      user_type = EXCLUDED.user_type
    WHERE profiles.telegram_id = EXCLUDED.telegram_id;
  END LOOP;
END;
$$;