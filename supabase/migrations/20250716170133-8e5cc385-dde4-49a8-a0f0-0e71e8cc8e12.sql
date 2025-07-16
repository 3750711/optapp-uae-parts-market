-- Find and fix duplicate telegram_id issue
-- First, let's see what profiles exist with this telegram_id
SELECT id, email, telegram, telegram_id, auth_method, created_at 
FROM public.profiles 
WHERE telegram_id = 1787040103;

-- Delete any profiles that don't have a corresponding auth.users record
DELETE FROM public.profiles 
WHERE telegram_id = 1787040103 
  AND NOT EXISTS (
    SELECT 1 FROM auth.users au WHERE au.id = profiles.id
  );

-- Now create the correct profile for the user who exists in auth.users
INSERT INTO public.profiles (
  id, 
  email, 
  full_name, 
  telegram, 
  telegram_id, 
  auth_method,
  user_type,
  verification_status
)
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'first_name' as full_name,
  au.raw_user_meta_data->>'username' as telegram,
  (au.raw_user_meta_data->>'telegram_id')::bigint as telegram_id,
  'telegram' as auth_method,
  'buyer' as user_type,
  'pending' as verification_status
FROM auth.users au
WHERE au.email = 'dmotrii_st.1787040103@telegram.partsbay.ae'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
  )
ON CONFLICT (telegram_id) DO NOTHING;