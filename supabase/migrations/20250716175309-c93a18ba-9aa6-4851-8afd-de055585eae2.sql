-- Delete user dmotrii_st.1787040103@telegram.partsbay.ae safely
-- First delete dependent records, then user data

-- Delete event logs that reference this user
DELETE FROM public.event_logs WHERE user_id = '158945a0-fbcf-49ab-ab41-acc149d4a1ee';

-- Delete from profiles
DELETE FROM public.profiles WHERE email = 'dmotrii_st.1787040103@telegram.partsbay.ae';

-- Delete from auth.users
DELETE FROM auth.users WHERE email = 'dmotrii_st.1787040103@telegram.partsbay.ae';