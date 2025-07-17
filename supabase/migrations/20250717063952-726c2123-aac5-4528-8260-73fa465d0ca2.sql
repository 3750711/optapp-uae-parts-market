-- Clean up duplicate Telegram account and link telegram_id to existing account
DO $$
DECLARE
    duplicate_user_id UUID;
    existing_user_id UUID;
BEGIN
    -- Find the duplicate account created via Telegram (❗️Dmitrii OPTAdmin ❗️)
    SELECT id INTO duplicate_user_id 
    FROM public.profiles 
    WHERE full_name = '❗️Dmitrii OPTAdmin ❗️' 
    AND auth_method = 'telegram'
    AND telegram_id = 1787040103;
    
    -- Find the existing account (Дмитрий Администратор 2)
    SELECT id INTO existing_user_id 
    FROM public.profiles 
    WHERE telegram = '@dmotrii_st' 
    AND telegram_id IS NULL;
    
    IF duplicate_user_id IS NOT NULL AND existing_user_id IS NOT NULL THEN
        RAISE NOTICE 'Found duplicate user: % and existing user: %', duplicate_user_id, existing_user_id;
        
        -- Delete the duplicate user completely (no related data exists yet)
        DELETE FROM public.profiles WHERE id = duplicate_user_id;
        DELETE FROM auth.users WHERE id = duplicate_user_id;
        
        -- Link the telegram_id to the existing account
        UPDATE public.profiles 
        SET telegram_id = 1787040103,
            auth_method = 'telegram'
        WHERE id = existing_user_id;
        
        RAISE NOTICE 'Successfully cleaned up duplicate and linked telegram_id to existing account';
    ELSE
        RAISE NOTICE 'Could not find both accounts. Duplicate: %, Existing: %', duplicate_user_id, existing_user_id;
    END IF;
END $$;