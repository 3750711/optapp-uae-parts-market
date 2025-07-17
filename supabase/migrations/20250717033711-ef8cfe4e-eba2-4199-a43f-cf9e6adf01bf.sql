-- Delete specific Telegram accounts as requested
-- This will remove profiles, auth users and all related records

-- First, get the user IDs for the accounts we want to delete
DO $$
DECLARE
    dmotrii_user_id UUID;
    user_user_id UUID;
BEGIN
    -- Get user IDs from profiles table
    SELECT id INTO dmotrii_user_id FROM public.profiles WHERE email = 'dmotrii_st.1787040103@telegram.partsbay.ae';
    SELECT id INTO user_user_id FROM public.profiles WHERE email = 'user.1787040103@telegram.partsbay.ae';
    
    -- Delete related records first to avoid foreign key constraint violations
    
    -- Delete event logs
    DELETE FROM public.event_logs WHERE user_id IN (dmotrii_user_id, user_user_id);
    
    -- Delete orders (both as buyer and seller)
    DELETE FROM public.orders WHERE buyer_id IN (dmotrii_user_id, user_user_id) OR seller_id IN (dmotrii_user_id, user_user_id);
    
    -- Delete products
    DELETE FROM public.products WHERE seller_id IN (dmotrii_user_id, user_user_id);
    
    -- Delete user favorites
    DELETE FROM public.user_favorites WHERE user_id IN (dmotrii_user_id, user_user_id);
    
    -- Delete request answers
    DELETE FROM public.request_answers WHERE user_id IN (dmotrii_user_id, user_user_id);
    
    -- Delete requests
    DELETE FROM public.requests WHERE user_id IN (dmotrii_user_id, user_user_id);
    
    -- Delete store reviews
    DELETE FROM public.store_reviews WHERE user_id IN (dmotrii_user_id, user_user_id);
    
    -- Delete stores
    DELETE FROM public.stores WHERE seller_id IN (dmotrii_user_id, user_user_id);
    
    -- Delete saved action logs
    DELETE FROM public.saved_action_logs WHERE saved_by IN (dmotrii_user_id, user_user_id);
    
    -- Delete logistics exports
    DELETE FROM public.logistics_exports WHERE created_by IN (dmotrii_user_id, user_user_id);
END $$;

-- Now delete profiles
DELETE FROM public.profiles 
WHERE email IN ('dmotrii_st.1787040103@telegram.partsbay.ae', 'user.1787040103@telegram.partsbay.ae');

-- Finally delete from auth.users
DELETE FROM auth.users 
WHERE email IN ('dmotrii_st.1787040103@telegram.partsbay.ae', 'user.1787040103@telegram.partsbay.ae');