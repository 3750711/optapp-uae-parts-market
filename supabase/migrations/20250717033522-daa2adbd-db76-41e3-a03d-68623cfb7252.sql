-- Delete specific Telegram accounts as requested
-- This will remove both the profile and auth user records

-- Delete profiles first
DELETE FROM public.profiles 
WHERE email IN ('dmotrii_st.1787040103@telegram.partsbay.ae', 'user.1787040103@telegram.partsbay.ae');

-- Delete from auth.users (this will cascade and clean up any remaining references)
DELETE FROM auth.users 
WHERE email IN ('dmotrii_st.1787040103@telegram.partsbay.ae', 'user.1787040103@telegram.partsbay.ae');