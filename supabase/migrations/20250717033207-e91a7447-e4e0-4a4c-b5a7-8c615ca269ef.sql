-- Delete specific Telegram account as requested
-- This will remove both the profile and auth user records

-- Delete profile first
DELETE FROM public.profiles 
WHERE email = 'dmotrii_st.1787040103@telegram.partsbay.ae';

-- Delete from auth.users (this will cascade and clean up any remaining references)
DELETE FROM auth.users 
WHERE email = 'dmotrii_st.1787040103@telegram.partsbay.ae';