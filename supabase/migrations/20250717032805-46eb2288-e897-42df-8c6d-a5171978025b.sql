-- Remove dependency on auth.users trigger and create missing profiles for existing Telegram users
-- Since Supabase restricts triggers on auth.users, we handle profile creation in the application

-- First, drop the trigger that won't work on auth.users in Supabase
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create missing profiles for existing Telegram users who don't have profiles
INSERT INTO public.profiles (
  id, 
  email, 
  auth_method,
  full_name,
  telegram_id,
  telegram,
  avatar_url,
  user_type
)
SELECT 
  au.id,
  au.email,
  'telegram',
  au.raw_user_meta_data->>'full_name',
  CASE 
    WHEN au.raw_user_meta_data->>'telegram_id' IS NOT NULL 
    THEN (au.raw_user_meta_data->>'telegram_id')::bigint
    ELSE NULL
  END,
  au.raw_user_meta_data->>'telegram',
  au.raw_user_meta_data->>'photo_url',
  COALESCE((au.raw_user_meta_data->>'user_type')::user_type, 'buyer'::user_type)
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL 
AND au.raw_user_meta_data->>'auth_method' = 'telegram'
ON CONFLICT (id) DO NOTHING;