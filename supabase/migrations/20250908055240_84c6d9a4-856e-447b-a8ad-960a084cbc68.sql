-- Fix the diagnose_auth_state function by removing reference to non-existent user_metadata column
CREATE OR REPLACE FUNCTION diagnose_auth_state(target_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  email_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  raw_user_meta_data JSONB,
  profile_exists BOOLEAN,
  profile_data JSONB,
  orders_count BIGINT,
  products_count BIGINT,
  notifications_count BIGINT
) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id as user_id,
    au.email,
    au.email_confirmed_at,
    au.created_at,
    au.updated_at,
    au.last_sign_in_at,
    au.raw_user_meta_data,
    (p.id IS NOT NULL) as profile_exists,
    to_jsonb(p.*) as profile_data,
    COALESCE(o.orders_count, 0) as orders_count,
    COALESCE(pr.products_count, 0) as products_count,
    COALESCE(n.notifications_count, 0) as notifications_count
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  LEFT JOIN (
    SELECT buyer_id as user_id, COUNT(*) as orders_count 
    FROM public.orders 
    GROUP BY buyer_id
  ) o ON o.user_id = au.id
  LEFT JOIN (
    SELECT seller_id as user_id, COUNT(*) as products_count 
    FROM public.products 
    GROUP BY seller_id
  ) pr ON pr.user_id = au.id
  LEFT JOIN (
    SELECT user_id, COUNT(*) as notifications_count 
    FROM public.notifications 
    GROUP BY user_id
  ) n ON n.user_id = au.id
  WHERE (target_user_id IS NULL OR au.id = target_user_id);
END;
$$;