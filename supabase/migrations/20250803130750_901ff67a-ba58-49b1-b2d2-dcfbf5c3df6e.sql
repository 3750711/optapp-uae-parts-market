-- Function to safely delete a specific user account (admin only)
CREATE OR REPLACE FUNCTION public.admin_delete_specific_user(
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_data RECORD;
  backup_data JSONB;
  products_data JSONB;
  orders_data JSONB;
BEGIN
  -- Only proceed if user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can use this function';
  END IF;

  -- Get user data for backup
  SELECT * INTO user_data
  FROM profiles
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User with ID % not found', p_user_id;
  END IF;

  -- Collect products data for backup
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', p.id,
      'title', p.title,
      'price', p.price,
      'brand', p.brand,
      'model', p.model,
      'description', p.description,
      'status', p.status,
      'created_at', p.created_at,
      'images', (
        SELECT COALESCE(json_agg(pi.url), '[]'::json)
        FROM product_images pi
        WHERE pi.product_id = p.id
      )
    )
  ), '[]'::json) INTO products_data
  FROM products p
  WHERE p.seller_id = p_user_id;

  -- Collect orders data for backup
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', o.id,
      'order_number', o.order_number,
      'title', o.title,
      'price', o.price,
      'status', o.status,
      'role', CASE 
        WHEN o.buyer_id = p_user_id THEN 'buyer'
        WHEN o.seller_id = p_user_id THEN 'seller'
        ELSE 'unknown'
      END,
      'created_at', o.created_at
    )
  ), '[]'::json) INTO orders_data
  FROM orders o
  WHERE o.buyer_id = p_user_id OR o.seller_id = p_user_id;

  -- Create comprehensive backup
  backup_data := jsonb_build_object(
    'user_profile', row_to_json(user_data),
    'products', products_data,
    'orders', orders_data,
    'deletion_timestamp', now(),
    'deleted_by', auth.uid()
  );

  -- Insert backup
  INSERT INTO account_operation_backups (
    user_id,
    operation_type,
    backup_data,
    created_by
  ) VALUES (
    p_user_id,
    'user_deletion',
    backup_data,
    auth.uid()
  );

  -- Delete product images first (foreign key constraint)
  DELETE FROM product_images 
  WHERE product_id IN (
    SELECT id FROM products WHERE seller_id = p_user_id
  );

  -- Delete product videos
  DELETE FROM product_videos 
  WHERE product_id IN (
    SELECT id FROM products WHERE seller_id = p_user_id
  );

  -- Delete products
  DELETE FROM products WHERE seller_id = p_user_id;

  -- Delete price offers where user is buyer or seller
  DELETE FROM price_offers 
  WHERE buyer_id = p_user_id OR seller_id = p_user_id;

  -- Delete notifications for this user
  DELETE FROM notifications WHERE user_id = p_user_id;

  -- Delete store reviews by this user
  DELETE FROM store_reviews WHERE user_id = p_user_id;

  -- Delete request answers by this user
  DELETE FROM request_answers WHERE user_id = p_user_id;

  -- Delete requests by this user
  DELETE FROM requests WHERE user_id = p_user_id;

  -- Delete store images for stores owned by this user
  DELETE FROM store_images 
  WHERE store_id IN (
    SELECT id FROM stores WHERE seller_id = p_user_id
  );

  -- Delete store car brands associations
  DELETE FROM store_car_brands 
  WHERE store_id IN (
    SELECT id FROM stores WHERE seller_id = p_user_id
  );

  -- Delete store car models associations
  DELETE FROM store_car_models 
  WHERE store_id IN (
    SELECT id FROM stores WHERE seller_id = p_user_id
  );

  -- Delete stores owned by this user
  DELETE FROM stores WHERE seller_id = p_user_id;

  -- Update orders to remove user references (preserve order history)
  UPDATE orders 
  SET buyer_id = NULL, buyer_opt_id = NULL, telegram_url_buyer = NULL
  WHERE buyer_id = p_user_id;

  UPDATE orders 
  SET seller_id = NULL, seller_opt_id = NULL
  WHERE seller_id = p_user_id;

  -- Delete the user's profile
  DELETE FROM profiles WHERE id = p_user_id;
  
  -- Delete the user's auth account
  DELETE FROM auth.users WHERE id = p_user_id;

  -- Log the successful deletion
  RAISE LOG 'Successfully deleted user % by admin %', p_user_id, auth.uid();
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error deleting user %: %', p_user_id, SQLERRM;
    RAISE;
END;
$$;

-- Execute the deletion for the specific user
SELECT admin_delete_specific_user('043a0642-9c0b-41d7-a80b-812841cb5937');