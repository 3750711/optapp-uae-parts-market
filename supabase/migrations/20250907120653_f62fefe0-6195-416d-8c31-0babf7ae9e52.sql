-- Migration: Add diagnostic and protective mechanisms for hardcoded function URLs
-- This migration creates tools to detect, prevent, and clean up hardcoded URLs in database functions

-- 1. Diagnostic view to find hardcoded URLs in functions and triggers
CREATE OR REPLACE VIEW public.v_hardcoded_urls_check AS
SELECT 
  p.proname as function_name,
  n.nspname as schema_name,
  p.prosrc as function_body,
  CASE 
    WHEN p.prosrc ~ 'https?://[^/]+\.supabase\.co/functions/v1/' THEN 'supabase.co hardcoded URL'
    WHEN p.prosrc ~ 'https://api\.partsbay\.ae/functions/v1/' THEN 'api.partsbay.ae hardcoded URL'
    WHEN p.prosrc ~ 'https?://[^/]+/functions/v1/' THEN 'other hardcoded function URL'
    ELSE NULL
  END as url_type,
  regexp_matches(p.prosrc, '(https?://[^/]+/functions/v1/[^''"\s]+)', 'g') as found_urls
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    p.prosrc ~ 'https?://[^/]+\.supabase\.co/functions/v1/' OR
    p.prosrc ~ 'https://api\.partsbay\.ae/functions/v1/' OR
    p.prosrc ~ 'https?://[^/]+/functions/v1/'
  );

COMMENT ON VIEW public.v_hardcoded_urls_check IS 'Diagnostic view to detect hardcoded function URLs in database functions';

-- 2. Security check function - returns error if hardcoded URLs found
CREATE OR REPLACE FUNCTION public.check_no_hardcoded_function_urls()
RETURNS TABLE(
  status text,
  message text,
  details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  url_count integer;
  url_details jsonb;
BEGIN
  -- Count hardcoded URLs
  SELECT COUNT(*), jsonb_agg(
    jsonb_build_object(
      'function_name', function_name,
      'schema_name', schema_name,
      'url_type', url_type,
      'found_urls', found_urls
    )
  )
  INTO url_count, url_details
  FROM public.v_hardcoded_urls_check;
  
  IF url_count > 0 THEN
    RETURN QUERY SELECT 
      'FAIL'::text,
      format('Found %s functions with hardcoded URLs', url_count)::text,
      url_details;
  ELSE
    RETURN QUERY SELECT 
      'PASS'::text,
      'No hardcoded function URLs detected'::text,
      '{}'::jsonb;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.check_no_hardcoded_function_urls() IS 'Security validation function to ensure no hardcoded function URLs exist';

-- 3. Idempotent cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_hardcoded_function_urls()
RETURNS TABLE(
  action text,
  function_name text,
  old_url text,
  new_url text,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  func_record record;
  new_body text;
BEGIN
  -- Loop through all functions with hardcoded URLs
  FOR func_record IN 
    SELECT * FROM public.v_hardcoded_urls_check
  LOOP
    new_body := func_record.function_body;
    
    -- Replace supabase.co URLs
    new_body := regexp_replace(
      new_body,
      'https://[^/]+\.supabase\.co/functions/v1/([^''"\s]+)',
      'public.functions_url(''\1'')',
      'g'
    );
    
    -- Replace api.partsbay.ae URLs  
    new_body := regexp_replace(
      new_body,
      'https://api\.partsbay\.ae/functions/v1/([^''"\s]+)',
      'public.functions_url(''\1'')',
      'g'
    );
    
    -- Replace other hardcoded function URLs
    new_body := regexp_replace(
      new_body,
      'https?://[^/]+/functions/v1/([^''"\s]+)',
      'public.functions_url(''\1'')',
      'g'
    );
    
    -- Only log if changes were made (actual function recreation would require more complex logic)
    IF new_body != func_record.function_body THEN
      -- Log the cleanup action
      INSERT INTO public.event_logs (
        action_type,
        entity_type,
        details
      ) VALUES (
        'url_cleanup_detected',
        'database_function',
        jsonb_build_object(
          'function_name', func_record.function_name,
          'schema_name', func_record.schema_name,
          'old_urls', func_record.found_urls,
          'cleanup_method', 'detected'
        )
      );
      
      RETURN QUERY SELECT 
        'DETECTED'::text,
        func_record.function_name::text,
        array_to_string(func_record.found_urls, ', ')::text,
        'public.functions_url()'::text,
        'Function needs manual update to use functions_url()'::text;
    END IF;
  END LOOP;
  
  -- If no functions found with hardcoded URLs
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      'SUCCESS'::text,
      'ALL'::text,
      ''::text,
      ''::text,
      'No hardcoded URLs found - system is clean'::text;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.cleanup_hardcoded_function_urls() IS 'Idempotent function to detect and report hardcoded function URLs that need cleanup';

-- 4. Protective validator function for CI/CD
CREATE OR REPLACE FUNCTION public.validate_functions_url_compliance()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  violation_count integer;
BEGIN
  -- Check for any hardcoded URLs
  SELECT COUNT(*) INTO violation_count
  FROM public.v_hardcoded_urls_check;
  
  IF violation_count > 0 THEN
    -- Log the violation
    INSERT INTO public.event_logs (
      action_type,
      entity_type,
      details
    ) VALUES (
      'compliance_violation',
      'url_validation',
      jsonb_build_object(
        'violation_count', violation_count,
        'check_time', now(),
        'message', 'Hardcoded function URLs detected'
      )
    );
    
    RAISE EXCEPTION 'URL Compliance Violation: Found % functions with hardcoded URLs. Use public.functions_url() instead.', violation_count;
  END IF;
  
  RETURN true;
END;
$$;

COMMENT ON FUNCTION public.validate_functions_url_compliance() IS 'Protective function that fails if hardcoded URLs are detected - for use in CI/CD';

-- 5. Utility function to get proper function URL patterns
CREATE OR REPLACE FUNCTION public.get_functions_url_patterns()
RETURNS TABLE(
  pattern_type text,
  correct_usage text,
  example text,
  description text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    'Standard Function Call'::text,
    'public.functions_url(''function-name'')'::text,
    'net.http_post(url := public.functions_url(''send-telegram-notification''), ...)'::text,
    'Use this pattern for all Edge Function calls from database triggers/functions'::text
  UNION ALL
  SELECT
    'With Path Parameters'::text,
    'public.functions_url(''function-name/path'')'::text,
    'net.http_get(url := public.functions_url(''api/health/check''))'::text,
    'For functions that accept additional path parameters'::text
  UNION ALL
  SELECT
    'Avoid - Hardcoded URL'::text,
    'NEVER USE: https://domain.com/functions/v1/...'::text,
    'BAD: net.http_post(url := ''https://api.partsbay.ae/functions/v1/send-notification'')'::text,
    'This creates tight coupling to specific domains and breaks flexibility'::text;
$$;

COMMENT ON FUNCTION public.get_functions_url_patterns() IS 'Documentation function showing correct and incorrect URL usage patterns';

-- 6. Create a monitoring function that can be called periodically
CREATE OR REPLACE FUNCTION public.monitor_function_url_compliance()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  check_result record;
BEGIN
  -- Get compliance status
  SELECT * INTO check_result
  FROM public.check_no_hardcoded_function_urls()
  LIMIT 1;
  
  -- Build monitoring result
  result := jsonb_build_object(
    'timestamp', now(),
    'compliance_status', check_result.status,
    'message', check_result.message,
    'details', check_result.details,
    'functions_base_url', (SELECT value FROM public.app_settings WHERE key = 'functions_base_url')
  );
  
  -- Log monitoring result
  INSERT INTO public.event_logs (
    action_type,
    entity_type,
    details
  ) VALUES (
    'compliance_monitoring',
    'url_validation',
    result
  );
  
  RETURN result;
END;
$$;