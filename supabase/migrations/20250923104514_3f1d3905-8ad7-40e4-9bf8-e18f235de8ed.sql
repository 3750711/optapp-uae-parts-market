-- Fix create_trusted_product function parameter order
CREATE OR REPLACE FUNCTION public.create_trusted_product(
  p_title TEXT,
  p_price NUMERIC,
  p_brand TEXT,
  p_description TEXT DEFAULT NULL,
  p_condition TEXT DEFAULT 'Новый',
  p_model TEXT DEFAULT NULL,
  p_place_number INTEGER DEFAULT 1,
  p_delivery_price NUMERIC DEFAULT 0
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  product_id UUID;
  user_profile RECORD;
  current_user_id UUID;
BEGIN
  -- Get current user ID with better error handling
  current_user_id := auth.uid();
  
  -- Log authentication context for debugging
  RAISE LOG 'create_trusted_product called with user_id: %, title: %', current_user_id, p_title;
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required. Please log in and try again.';
  END IF;

  -- Get user profile with detailed error handling
  SELECT id, full_name, user_type, is_trusted_seller, opt_id
  INTO user_profile
  FROM public.profiles
  WHERE id = current_user_id;

  IF user_profile IS NULL THEN
    RAISE EXCEPTION 'User profile not found for user ID: %', current_user_id;
  END IF;

  RAISE LOG 'Found user profile: name=%, type=%, trusted=%', user_profile.full_name, user_profile.user_type, user_profile.is_trusted_seller;

  -- Check if user is a trusted seller
  IF NOT user_profile.is_trusted_seller THEN
    RAISE EXCEPTION 'Access denied. Only trusted sellers can use this function. Current status: trusted=%, type=%', 
                    user_profile.is_trusted_seller, user_profile.user_type;
  END IF;

  -- Validate required parameters
  IF p_title IS NULL OR LENGTH(TRIM(p_title)) = 0 THEN
    RAISE EXCEPTION 'Product title is required';
  END IF;

  IF p_price IS NULL OR p_price <= 0 THEN
    RAISE EXCEPTION 'Valid product price is required';
  END IF;

  IF p_brand IS NULL OR LENGTH(TRIM(p_brand)) = 0 THEN
    RAISE EXCEPTION 'Product brand is required';
  END IF;

  -- Insert product
  INSERT INTO public.products (
    title,
    price,
    description,
    condition,
    brand,
    model,
    seller_id,
    seller_name,
    status,
    place_number,
    delivery_price,
    optid_created,
    requires_moderation
  ) VALUES (
    TRIM(p_title),
    p_price,
    COALESCE(TRIM(p_description), ''),
    COALESCE(p_condition, 'Новый'),
    TRIM(p_brand),
    CASE WHEN p_model IS NOT NULL AND LENGTH(TRIM(p_model)) > 0 
         THEN TRIM(p_model) 
         ELSE NULL END,
    user_profile.id,
    COALESCE(TRIM(user_profile.full_name), 'Unknown Seller'),
    'active'::product_status, -- Trusted sellers get active status immediately
    COALESCE(p_place_number, 1),
    COALESCE(p_delivery_price, 0),
    user_profile.opt_id,
    false -- Trusted sellers products don't require moderation
  )
  RETURNING id INTO product_id;

  RAISE LOG 'Successfully created trusted product: id=%, title=%', product_id, p_title;

  RETURN product_id;

EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in create_trusted_product: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RAISE;
END;
$$;