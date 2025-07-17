-- Delete specific Telegram account: dmotrii_st.1787040103@telegram.partsbay.ae
-- This will remove profile, auth user and all related records

-- First, get the user ID for the account we want to delete
DO $$
DECLARE
    dmotrii_user_id UUID;
BEGIN
    -- Get user ID from profiles table
    SELECT id INTO dmotrii_user_id FROM public.profiles WHERE email = 'dmotrii_st.1787040103@telegram.partsbay.ae';
    
    -- Only proceed if user exists
    IF dmotrii_user_id IS NOT NULL THEN
        -- Delete related records first to avoid foreign key constraint violations
        
        -- Delete event logs
        DELETE FROM public.event_logs WHERE user_id = dmotrii_user_id;
        
        -- Delete orders (both as buyer and seller)
        DELETE FROM public.orders WHERE buyer_id = dmotrii_user_id OR seller_id = dmotrii_user_id;
        
        -- Delete products
        DELETE FROM public.products WHERE seller_id = dmotrii_user_id;
        
        -- Delete user favorites
        DELETE FROM public.user_favorites WHERE user_id = dmotrii_user_id;
        
        -- Delete request answers
        DELETE FROM public.request_answers WHERE user_id = dmotrii_user_id;
        
        -- Delete requests
        DELETE FROM public.requests WHERE user_id = dmotrii_user_id;
        
        -- Delete store reviews
        DELETE FROM public.store_reviews WHERE user_id = dmotrii_user_id;
        
        -- Delete stores
        DELETE FROM public.stores WHERE seller_id = dmotrii_user_id;
        
        -- Delete saved action logs
        DELETE FROM public.saved_action_logs WHERE saved_by = dmotrii_user_id;
        
        -- Delete logistics exports
        DELETE FROM public.logistics_exports WHERE created_by = dmotrii_user_id;
        
        RAISE NOTICE 'Deleted all related records for user: %', dmotrii_user_id;
        
        -- Now delete profile
        DELETE FROM public.profiles WHERE id = dmotrii_user_id;
        
        -- Finally delete from auth.users
        DELETE FROM auth.users WHERE id = dmotrii_user_id;
        
        RAISE NOTICE 'Successfully deleted user: dmotrii_st.1787040103@telegram.partsbay.ae';
    ELSE
        RAISE NOTICE 'User with email dmotrii_st.1787040103@telegram.partsbay.ae not found';
    END IF;
END $$;