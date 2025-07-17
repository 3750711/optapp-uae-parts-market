-- Delete user dmotrii_st.1787040103@telegram.partsbay.ae and all related data
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Get the user ID
    SELECT id INTO target_user_id 
    FROM public.profiles 
    WHERE email = 'dmotrii_st.1787040103@telegram.partsbay.ae';
    
    IF target_user_id IS NOT NULL THEN
        RAISE NOTICE 'Found user with ID: %', target_user_id;
        
        -- Delete from all related tables first
        DELETE FROM public.event_logs WHERE user_id = target_user_id;
        DELETE FROM public.user_favorites WHERE user_id = target_user_id;
        DELETE FROM public.request_answers WHERE user_id = target_user_id;
        DELETE FROM public.requests WHERE user_id = target_user_id;
        DELETE FROM public.store_reviews WHERE user_id = target_user_id;
        DELETE FROM public.saved_action_logs WHERE saved_by = target_user_id;
        DELETE FROM public.logistics_exports WHERE created_by = target_user_id;
        
        -- Delete orders (both as buyer and seller)
        DELETE FROM public.orders WHERE buyer_id = target_user_id OR seller_id = target_user_id;
        
        -- Delete products 
        DELETE FROM public.products WHERE seller_id = target_user_id;
        
        -- Delete stores
        DELETE FROM public.stores WHERE seller_id = target_user_id;
        
        -- Delete profile
        DELETE FROM public.profiles WHERE id = target_user_id;
        
        -- Delete from auth.users
        DELETE FROM auth.users WHERE id = target_user_id;
        
        RAISE NOTICE 'Successfully deleted user: dmotrii_st.1787040103@telegram.partsbay.ae';
    ELSE
        RAISE NOTICE 'User dmotrii_st.1787040103@telegram.partsbay.ae not found';
    END IF;
END $$;