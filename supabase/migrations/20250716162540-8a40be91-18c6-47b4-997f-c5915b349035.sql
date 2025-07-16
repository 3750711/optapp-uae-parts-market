-- Create profile for user with admin rights
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
  '158945a0-fbcf-49ab-ab41-acc149d4a1ee',
  'dmotrii_st.1787040103@telegram.partsbay.ae',
  'telegram',
  '❗️Dmitrii OPTAdmin ❗️',
  1787040103,
  'dmotrii_st',
  'https://t.me/i/userpic/320/3LfsoElR3T5QcqOwKfEYWs6kBc0FBvEfsEhRpQ70atU.jpg',
  'admin'
);