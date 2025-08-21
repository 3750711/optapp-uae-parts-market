-- Update the complete_profile_after_signup function to include opt_id parameter
CREATE OR REPLACE FUNCTION public.complete_profile_after_signup(
  p_full_name text,
  p_company_name text,
  p_location text,
  p_phone text,
  p_telegram text,
  p_user_type text,
  p_opt_id text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id UUID;
  existing_profile_id UUID;
  result JSON;
BEGIN
  -- Get current user ID
  user_id := auth.uid();
  
  -- Check if user is authenticated
  IF user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'User not authenticated'
    );
  END IF;

  -- Log the parameters for debugging
  RAISE LOG 'complete_profile_after_signup called with: user_id=%, full_name=%, opt_id=%, user_type=%', 
    user_id, p_full_name, p_opt_id, p_user_type;

  -- Check if profile already exists
  SELECT id INTO existing_profile_id
  FROM public.profiles 
  WHERE id = user_id;
  
  -- If profile exists, update it
  IF existing_profile_id IS NOT NULL THEN
    UPDATE public.profiles SET
      full_name = p_full_name,
      company_name = CASE WHEN p_user_type = 'seller' THEN p_company_name ELSE NULL END,
      location = p_location,
      phone = p_phone,
      telegram = p_telegram,
      user_type = p_user_type::user_type,
      opt_id = COALESCE(p_opt_id, opt_id), -- Use provided opt_id or keep existing
      profile_completed = true,
      accepted_terms = true,
      accepted_privacy = true,
      accepted_terms_at = NOW(),
      accepted_privacy_at = NOW()
    WHERE id = user_id;
    
    RAISE LOG 'Profile updated for user_id=%, opt_id=%', user_id, p_opt_id;
    
    RETURN json_build_object(
      'success', true,
      'message', 'Profile updated successfully'
    );
  END IF;
  
  -- Create new profile
  INSERT INTO public.profiles (
    id,
    full_name,
    company_name,
    location,
    phone,
    telegram,
    user_type,
    opt_id,
    email,
    profile_completed,
    accepted_terms,
    accepted_privacy,
    accepted_terms_at,
    accepted_privacy_at,
    auth_method
  ) VALUES (
    user_id,
    p_full_name,
    CASE WHEN p_user_type = 'seller' THEN p_company_name ELSE NULL END,
    p_location,
    p_phone,
    p_telegram,
    p_user_type::user_type,
    p_opt_id,
    COALESCE(
      (SELECT email FROM auth.users WHERE id = user_id),
      'unknown@temp.com'
    ),
    true,
    true,
    true,
    NOW(),
    NOW(),
    'email'
  );
  
  RAISE LOG 'Profile created for user_id=%, opt_id=%', user_id, p_opt_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Profile created successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Error in complete_profile_after_signup: %', SQLERRM;
  RETURN json_build_object(
    'success', false,
    'message', 'Error creating profile: ' || SQLERRM
  );
END;
$$;