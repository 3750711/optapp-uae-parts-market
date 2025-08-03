-- Create admin function to safely delete a specific user with all related data
CREATE OR REPLACE FUNCTION public.admin_delete_specific_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_data JSONB;
  backup_id UUID;
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can use this function';
  END IF;

  -- Check if target user exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User with ID % not found', p_user_id;
  END IF;

  -- Collect all user data for backup
  SELECT jsonb_build_object(
    'profile', (SELECT to_jsonb(p.*) FROM public.profiles p WHERE p.id = p_user_id),
    'products', (SELECT COALESCE(jsonb_agg(to_jsonb(pr.*)), '[]'::jsonb) FROM public.products pr WHERE pr.seller_id = p_user_id),
    'orders_as_buyer', (SELECT COALESCE(jsonb_agg(to_jsonb(o.*)), '[]'::jsonb) FROM public.orders o WHERE o.buyer_id = p_user_id),
    'orders_as_seller', (SELECT COALESCE(jsonb_agg(to_jsonb(o.*)), '[]'::jsonb) FROM public.orders o WHERE o.seller_id = p_user_id),
    'price_offers_as_buyer', (SELECT COALESCE(jsonb_agg(to_jsonb(po.*)), '[]'::jsonb) FROM public.price_offers po WHERE po.buyer_id = p_user_id),
    'price_offers_as_seller', (SELECT COALESCE(jsonb_agg(to_jsonb(po.*)), '[]'::jsonb) FROM public.price_offers po WHERE po.seller_id = p_user_id),
    'stores', (SELECT COALESCE(jsonb_agg(to_jsonb(s.*)), '[]'::jsonb) FROM public.stores s WHERE s.seller_id = p_user_id),
    'requests', (SELECT COALESCE(jsonb_agg(to_jsonb(r.*)), '[]'::jsonb) FROM public.requests r WHERE r.user_id = p_user_id),
    'deleted_at', now(),
    'deleted_by', auth.uid()
  ) INTO user_data;

  -- Create backup
  INSERT INTO public.account_operation_backups (
    user_id,
    operation_type,
    backup_data,
    created_by
  ) VALUES (
    p_user_id,
    'admin_delete_user',
    user_data,
    auth.uid()
  ) RETURNING id INTO backup_id;

  -- Delete related data in correct order to avoid foreign key constraints
  
  -- 1. Delete price offers (both as buyer and seller)
  DELETE FROM public.price_offers WHERE buyer_id = p_user_id OR seller_id = p_user_id;
  
  -- 2. Delete request answers
  DELETE FROM public.request_answers WHERE user_id = p_user_id;
  
  -- 3. Delete requests  
  DELETE FROM public.requests WHERE user_id = p_user_id;
  
  -- 4. Delete order images and videos for orders where user is buyer/seller
  DELETE FROM public.order_images WHERE order_id IN (
    SELECT id FROM public.orders WHERE buyer_id = p_user_id OR seller_id = p_user_id
  );
  DELETE FROM public.order_videos WHERE order_id IN (
    SELECT id FROM public.orders WHERE buyer_id = p_user_id OR seller_id = p_user_id
  );
  DELETE FROM public.confirm_images WHERE order_id IN (
    SELECT id FROM public.orders WHERE buyer_id = p_user_id OR seller_id = p_user_id
  );
  
  -- 5. Delete orders
  DELETE FROM public.orders WHERE buyer_id = p_user_id OR seller_id = p_user_id;
  
  -- 6. Delete product images and videos for user's products
  DELETE FROM public.product_images WHERE product_id IN (
    SELECT id FROM public.products WHERE seller_id = p_user_id
  );
  DELETE FROM public.product_videos WHERE product_id IN (
    SELECT id FROM public.products WHERE seller_id = p_user_id
  );
  
  -- 7. Delete products
  DELETE FROM public.products WHERE seller_id = p_user_id;
  
  -- 8. Delete store related data
  DELETE FROM public.store_reviews WHERE store_id IN (
    SELECT id FROM public.stores WHERE seller_id = p_user_id
  );
  DELETE FROM public.store_images WHERE store_id IN (
    SELECT id FROM public.stores WHERE seller_id = p_user_id
  );
  DELETE FROM public.store_car_models WHERE store_id IN (
    SELECT id FROM public.stores WHERE seller_id = p_user_id
  );
  DELETE FROM public.store_car_brands WHERE store_id IN (
    SELECT id FROM public.stores WHERE seller_id = p_user_id
  );
  DELETE FROM public.stores WHERE seller_id = p_user_id;
  
  -- 9. Delete notifications
  DELETE FROM public.notifications WHERE user_id = p_user_id;
  
  -- 10. Delete message history
  DELETE FROM public.message_history WHERE sender_id = p_user_id;
  
  -- 11. Delete profile
  DELETE FROM public.profiles WHERE id = p_user_id;
  
  -- 12. Finally delete from auth.users
  DELETE FROM auth.users WHERE id = p_user_id;
  
  RAISE LOG 'Successfully deleted user % with backup ID %', p_user_id, backup_id;
  
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error deleting user %: %', p_user_id, SQLERRM;
    RAISE;
END;
$$;