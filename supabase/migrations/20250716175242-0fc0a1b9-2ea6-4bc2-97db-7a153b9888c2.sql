-- Delete user dmotrii_st.1787040103@telegram.partsbay.ae
-- First delete from profiles, then from auth.users

DELETE FROM public.profiles WHERE email = 'dmotrii_st.1787040103@telegram.partsbay.ae';
DELETE FROM auth.users WHERE email = 'dmotrii_st.1787040103@telegram.partsbay.ae';