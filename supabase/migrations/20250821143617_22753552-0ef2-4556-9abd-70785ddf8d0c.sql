-- Fix the existing tsh@g.com profile by adding missing opt_id and correcting user_type
-- First, let's check if this profile exists and get their ID
DO $$
DECLARE
    user_profile_id uuid;
    new_opt_id text := 'TSHX'; -- Generate a unique opt_id for this user
BEGIN
    -- Get the user ID for tsh@g.com
    SELECT id INTO user_profile_id 
    FROM public.profiles 
    WHERE email = 'tsh@g.com';
    
    IF user_profile_id IS NOT NULL THEN
        -- Update the profile with correct data
        UPDATE public.profiles 
        SET 
            opt_id = new_opt_id,
            user_type = 'seller',
            full_name = COALESCE(full_name, 'Test User'),
            accepted_terms = true,
            accepted_privacy = true,
            accepted_terms_at = COALESCE(accepted_terms_at, now()),
            accepted_privacy_at = COALESCE(accepted_privacy_at, now()),
            profile_completed = true
        WHERE id = user_profile_id;
        
        RAISE LOG 'Fixed profile for tsh@g.com with opt_id: %', new_opt_id;
    ELSE
        RAISE LOG 'Profile not found for tsh@g.com';
    END IF;
END $$;