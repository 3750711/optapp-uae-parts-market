-- Update admin_delete_specific_user function to handle all foreign key constraints properly
CREATE OR REPLACE FUNCTION public.admin_delete_specific_user(
  p_user_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
  backup_data jsonb := '{}';
  deleted_counts jsonb := '{}';
  temp_count integer;
BEGIN
  -- Only proceed if user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can use this function';
  END IF;

  -- Get user ID by email
  SELECT id INTO target_user_id
  FROM profiles
  WHERE email = p_user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', p_user_email;
  END IF;

  RAISE LOG 'Starting deletion process for user: % (ID: %)', p_user_email, target_user_id;

  -- Create comprehensive backup of user data
  SELECT jsonb_build_object(
    'user_id', target_user_id,
    'email', p_user_email,
    'profile', (SELECT to_jsonb(p.*) FROM profiles p WHERE p.id = target_user_id),
    'products', (SELECT COALESCE(jsonb_agg(to_jsonb(pr.*)), '[]'::jsonb) FROM products pr WHERE pr.seller_id = target_user_id),
    'orders_as_buyer', (SELECT COALESCE(jsonb_agg(to_jsonb(o.*)), '[]'::jsonb) FROM orders o WHERE o.buyer_id = target_user_id),
    'orders_as_seller', (SELECT COALESCE(jsonb_agg(to_jsonb(o.*)), '[]'::jsonb) FROM orders o WHERE o.seller_id = target_user_id),
    'price_offers_as_buyer', (SELECT COALESCE(jsonb_agg(to_jsonb(po.*)), '[]'::jsonb) FROM price_offers po WHERE po.buyer_id = target_user_id),
    'price_offers_as_seller', (SELECT COALESCE(jsonb_agg(to_jsonb(po.*)), '[]'::jsonb) FROM price_offers po WHERE po.seller_id = target_user_id),
    'stores', (SELECT COALESCE(jsonb_agg(to_jsonb(s.*)), '[]'::jsonb) FROM stores s WHERE s.seller_id = target_user_id),
    'requests', (SELECT COALESCE(jsonb_agg(to_jsonb(r.*)), '[]'::jsonb) FROM requests r WHERE r.user_id = target_user_id),
    'request_answers', (SELECT COALESCE(jsonb_agg(to_jsonb(ra.*)), '[]'::jsonb) FROM request_answers ra WHERE ra.user_id = target_user_id),
    'notifications', (SELECT COALESCE(jsonb_agg(to_jsonb(n.*)), '[]'::jsonb) FROM notifications n WHERE n.user_id = target_user_id),
    'event_logs', (SELECT COALESCE(jsonb_agg(to_jsonb(el.*)), '[]'::jsonb) FROM event_logs el WHERE el.user_id = target_user_id),
    'message_history', (SELECT COALESCE(jsonb_agg(to_jsonb(mh.*)), '[]'::jsonb) FROM message_history mh WHERE mh.sender_id = target_user_id OR target_user_id = ANY(mh.recipient_ids))
  ) INTO backup_data;

  -- Store backup
  INSERT INTO account_operation_backups (
    user_id,
    operation_type,
    backup_data,
    created_by
  ) VALUES (
    target_user_id,
    'user_deletion',
    backup_data,
    auth.uid()
  );

  RAISE LOG 'Backup created successfully for user %', target_user_id;

  -- Now delete data in correct order to handle foreign key constraints

  -- 1. Delete price offers (references products and users)
  DELETE FROM price_offers WHERE buyer_id = target_user_id OR seller_id = target_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{price_offers}', to_jsonb(temp_count));
  RAISE LOG 'Deleted % price offers', temp_count;

  -- 2. Delete request answers (references requests and users)
  DELETE FROM request_answers WHERE user_id = target_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{request_answers}', to_jsonb(temp_count));
  RAISE LOG 'Deleted % request answers', temp_count;

  -- 3. Delete requests (references users)
  DELETE FROM requests WHERE user_id = target_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{requests}', to_jsonb(temp_count));
  RAISE LOG 'Deleted % requests', temp_count;

  -- 4. Delete order images and videos (references orders)
  DELETE FROM order_images WHERE order_id IN (
    SELECT id FROM orders WHERE buyer_id = target_user_id OR seller_id = target_user_id
  );
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{order_images}', to_jsonb(temp_count));
  RAISE LOG 'Deleted % order images', temp_count;

  DELETE FROM order_videos WHERE order_id IN (
    SELECT id FROM orders WHERE buyer_id = target_user_id OR seller_id = target_user_id
  );
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{order_videos}', to_jsonb(temp_count));
  RAISE LOG 'Deleted % order videos', temp_count;

  DELETE FROM confirm_images WHERE order_id IN (
    SELECT id FROM orders WHERE buyer_id = target_user_id OR seller_id = target_user_id
  );
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{confirm_images}', to_jsonb(temp_count));
  RAISE LOG 'Deleted % confirm images', temp_count;

  -- 5. Anonymize orders instead of deleting (to preserve order history)
  UPDATE orders SET 
    buyer_id = NULL,
    seller_id = CASE WHEN seller_id = target_user_id THEN NULL ELSE seller_id END,
    order_seller_name = CASE WHEN seller_id = target_user_id THEN 'Deleted User' ELSE order_seller_name END,
    buyer_opt_id = CASE WHEN buyer_id = target_user_id THEN NULL ELSE buyer_opt_id END,
    seller_opt_id = CASE WHEN seller_id = target_user_id THEN NULL ELSE seller_opt_id END,
    telegram_url_buyer = CASE WHEN buyer_id = target_user_id THEN NULL ELSE telegram_url_buyer END,
    telegram_url_order = CASE WHEN seller_id = target_user_id THEN NULL ELSE telegram_url_order END
  WHERE buyer_id = target_user_id OR seller_id = target_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{orders_anonymized}', to_jsonb(temp_count));
  RAISE LOG 'Anonymized % orders', temp_count;

  -- 6. Delete product images and videos (references products)
  DELETE FROM product_images WHERE product_id IN (
    SELECT id FROM products WHERE seller_id = target_user_id
  );
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{product_images}', to_jsonb(temp_count));
  RAISE LOG 'Deleted % product images', temp_count;

  DELETE FROM product_videos WHERE product_id IN (
    SELECT id FROM products WHERE seller_id = target_user_id
  );
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{product_videos}', to_jsonb(temp_count));
  RAISE LOG 'Deleted % product videos', temp_count;

  -- 7. Delete products (references users)
  DELETE FROM products WHERE seller_id = target_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{products}', to_jsonb(temp_count));
  RAISE LOG 'Deleted % products', temp_count;

  -- 8. Delete store-related data
  DELETE FROM store_car_brands WHERE store_id IN (
    SELECT id FROM stores WHERE seller_id = target_user_id
  );
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{store_car_brands}', to_jsonb(temp_count));
  RAISE LOG 'Deleted % store car brands', temp_count;

  DELETE FROM store_car_models WHERE store_id IN (
    SELECT id FROM stores WHERE seller_id = target_user_id
  );
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{store_car_models}', to_jsonb(temp_count));
  RAISE LOG 'Deleted % store car models', temp_count;

  DELETE FROM store_reviews WHERE store_id IN (
    SELECT id FROM stores WHERE seller_id = target_user_id
  ) OR user_id = target_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{store_reviews}', to_jsonb(temp_count));
  RAISE LOG 'Deleted % store reviews', temp_count;

  DELETE FROM store_images WHERE store_id IN (
    SELECT id FROM stores WHERE seller_id = target_user_id
  );
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{store_images}', to_jsonb(temp_count));
  RAISE LOG 'Deleted % store images', temp_count;

  DELETE FROM stores WHERE seller_id = target_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{stores}', to_jsonb(temp_count));
  RAISE LOG 'Deleted % stores', temp_count;

  -- 9. Delete notifications (references users)
  DELETE FROM notifications WHERE user_id = target_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{notifications}', to_jsonb(temp_count));
  RAISE LOG 'Deleted % notifications', temp_count;

  -- 10. Delete message history (references users)
  DELETE FROM message_history WHERE sender_id = target_user_id OR target_user_id = ANY(recipient_ids);
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{message_history}', to_jsonb(temp_count));
  RAISE LOG 'Deleted % message history entries', temp_count;

  -- 11. Delete event logs (THIS WAS MISSING - CRITICAL!)
  DELETE FROM event_logs WHERE user_id = target_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{event_logs}', to_jsonb(temp_count));
  RAISE LOG 'Deleted % event logs', temp_count;

  -- 12. Delete profile (references auth.users)
  DELETE FROM profiles WHERE id = target_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{profiles}', to_jsonb(temp_count));
  RAISE LOG 'Deleted % profiles', temp_count;

  -- 13. Finally delete from auth.users
  DELETE FROM auth.users WHERE id = target_user_id;
  GET DIAGNOSTICS temp_count = ROW_COUNT;
  deleted_counts := jsonb_set(deleted_counts, '{auth_users}', to_jsonb(temp_count));
  RAISE LOG 'Deleted % auth users', temp_count;

  RAISE LOG 'Successfully completed deletion for user % (ID: %)', p_user_email, target_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'User successfully deleted',
    'user_email', p_user_email,
    'user_id', target_user_id,
    'deleted_counts', deleted_counts,
    'backup_created', true
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error deleting user % (ID: %): %', p_user_email, target_user_id, SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'user_email', p_user_email,
      'user_id', target_user_id
    );
END;
$$;