-- Update secure_update_profile function to include preferred_locale field
CREATE OR REPLACE FUNCTION public.secure_update_profile(
  p_user_id UUID,
  p_updates JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  current_user_type TEXT;
BEGIN
  -- Check if the calling user is an admin
  SELECT user_type INTO current_user_type
  FROM public.profiles
  WHERE id = auth.uid();
  
  IF current_user_type != 'admin' THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Only administrators can use this function'
    );
  END IF;
  
  -- Log the operation
  RAISE LOG 'Admin % updating profile % with data: %', auth.uid(), p_user_id, p_updates;
  
  -- Perform the update
  UPDATE public.profiles
  SET
    full_name = COALESCE((p_updates->>'full_name')::TEXT, full_name),
    company_name = COALESCE((p_updates->>'company_name')::TEXT, company_name),
    phone = COALESCE((p_updates->>'phone')::TEXT, phone),
    telegram = COALESCE((p_updates->>'telegram')::TEXT, telegram),
    opt_id = COALESCE((p_updates->>'opt_id')::TEXT, opt_id),
    user_type = COALESCE((p_updates->>'user_type')::user_type, user_type),
    verification_status = COALESCE((p_updates->>'verification_status')::verification_status, verification_status),
    communication_ability = COALESCE((p_updates->>'communication_ability')::INTEGER, communication_ability),
    rating = COALESCE((p_updates->>'rating')::NUMERIC, rating),
    is_trusted_seller = COALESCE((p_updates->>'is_trusted_seller')::BOOLEAN, is_trusted_seller),
    preferred_locale = COALESCE((p_updates->>'preferred_locale')::TEXT, preferred_locale)
  WHERE id = p_user_id;
  
  -- Check if the update was successful
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'User not found'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Profile updated successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in secure_update_profile: %', SQLERRM;
    RETURN json_build_object(
      'success', false,
      'message', SQLERRM
    );
END;
$$;