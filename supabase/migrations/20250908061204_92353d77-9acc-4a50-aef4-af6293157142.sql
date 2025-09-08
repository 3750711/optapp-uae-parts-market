-- Drop and recreate diagnose_auth_state function with proper naming
DROP FUNCTION IF EXISTS diagnose_auth_state(UUID);

CREATE OR REPLACE FUNCTION diagnose_auth_state(target_user_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    result JSON;
    auth_user_data JSON;
    profile_data JSON;
    session_data JSON;
    metadata_info JSON;
BEGIN
    -- If no user_id provided, try to get from current session
    IF target_user_id IS NULL THEN
        target_user_id := auth.uid();
    END IF;
    
    -- If still no user_id, return error
    IF target_user_id IS NULL THEN
        RETURN json_build_object(
            'error', 'No user_id provided and no active session found',
            'timestamp', NOW()
        );
    END IF;
    
    -- Get auth user data (this will be limited in RLS context)
    SELECT json_build_object(
        'id', au.id,
        'email', au.email,
        'created_at', au.created_at,
        'updated_at', au.updated_at,
        'last_sign_in_at', au.last_sign_in_at
    ) INTO auth_user_data
    FROM auth.users au
    WHERE au.id = target_user_id;
    
    -- Get profile data
    SELECT json_build_object(
        'user_id', p.user_id,
        'user_type', p.user_type,
        'verification_status', p.verification_status,
        'created_at', p.created_at,
        'updated_at', p.updated_at,
        'first_login_completed', p.first_login_completed
    ) INTO profile_data
    FROM profiles p
    WHERE p.user_id = target_user_id;
    
    -- Get session information (limited by RLS)
    SELECT json_build_object(
        'session_count', COUNT(*),
        'latest_session', MAX(s.created_at)
    ) INTO session_data
    FROM auth.sessions s
    WHERE s.user_id = target_user_id;
    
    -- Get metadata
    SELECT json_build_object(
        'profile_exists', CASE WHEN profile_data IS NOT NULL THEN true ELSE false END,
        'auth_user_exists', CASE WHEN auth_user_data IS NOT NULL THEN true ELSE false END,
        'data_sync_status', CASE 
            WHEN auth_user_data IS NOT NULL AND profile_data IS NOT NULL THEN 'synced'
            WHEN auth_user_data IS NOT NULL AND profile_data IS NULL THEN 'profile_missing'
            WHEN auth_user_data IS NULL AND profile_data IS NOT NULL THEN 'auth_missing'
            ELSE 'both_missing'
        END
    ) INTO metadata_info;
    
    -- Build final result
    SELECT json_build_object(
        'user_id', target_user_id,
        'auth_user', COALESCE(auth_user_data, 'null'::json),
        'profile', COALESCE(profile_data, 'null'::json),
        'sessions', COALESCE(session_data, 'null'::json),
        'metadata', metadata_info,
        'timestamp', NOW(),
        'diagnosed_by', auth.uid()
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;