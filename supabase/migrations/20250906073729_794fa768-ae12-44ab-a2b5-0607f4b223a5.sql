-- Step 0: Backup current definitions
SELECT now() AS backup_timestamp;

-- Create backup table for function definitions
CREATE TABLE IF NOT EXISTS function_backup_20250106 (
    func_name text,
    original_definition text,
    backup_timestamp timestamp DEFAULT now()
);

-- Backup all problematic functions
INSERT INTO function_backup_20250106 (func_name, original_definition)
SELECT p.oid::regprocedure::text, pg_get_functiondef(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public'
  AND (
       pg_get_functiondef(p.oid) ILIKE '%/functions/v1/%'
    OR pg_get_functiondef(p.oid) ILIKE '%Authorization%Bearer%'
  );

-- Step 1: Apply autopatch to all problematic functions
DO $$
DECLARE
  r record;
  src text;
  patched text;
BEGIN
  FOR r IN
    SELECT p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname='public'
      AND (
           pg_get_functiondef(p.oid) ILIKE '%/functions/v1/%'
        OR pg_get_functiondef(p.oid) ILIKE '%Authorization%Bearer%'
      )
  LOOP
    src := pg_get_functiondef(r.oid);

    -- 1) Replace any absolute URL to /functions/v1/<name> with functions_url('<name>')
    -- example match: url := 'https://api.partsbay.ae/functions/v1/send-telegram-notification'
    patched := regexp_replace(
      src,
      $$url\s*:=\s*'https?://[^']*/functions/v1/([a-zA-Z0-9_\-]+)'$$,
      $$url := public.functions_url('\1')$$,
      'gi'
    );

    -- 2) Normalize headers: remove Authorization Bearer and leave only Content-Type
    -- Replace any headers := '...json...'::jsonb with strictly safe version
    patched := regexp_replace(
      patched,
      $$headers\s*:=\s*'[^']*'::jsonb$$,
      $$headers := '{"Content-Type": "application/json"}'::jsonb$$,
      'gi'
    );

    -- Apply the replaced definition
    EXECUTE patched;
    
    RAISE LOG 'Patched function: %', r.oid::regprocedure;
  END LOOP;
END $$;

-- Step 2: Verification - these should return empty results

-- Check 1: No supabase.co references should remain
SELECT 'supabase.co check' as check_type, p.oid::regprocedure AS problematic_func
FROM pg_proc p
JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public'
  AND pg_get_functiondef(p.oid) ILIKE '%supabase.co/functions/v1%';

-- Check 2: No direct /functions/v1 without functions_url should remain
SELECT 'direct functions/v1 check' as check_type, p.oid::regprocedure AS problematic_func
FROM pg_proc p
JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public'
  AND pg_get_functiondef(p.oid) ILIKE '%/functions/v1/%'
  AND pg_get_functiondef(p.oid) NOT ILIKE '%functions_url(%';

-- Check 3: No net.http_post without functions_url should remain
SELECT 'net.http_post check' as check_type, p.oid::regprocedure AS problematic_func
FROM pg_proc p
JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public'
  AND pg_get_functiondef(p.oid) ILIKE '%net.http_post%'
  AND pg_get_functiondef(p.oid) NOT ILIKE '%functions_url(%';

-- Step 3: Spot check of specific critical functions
SELECT 'final verification' as check_type, p.oid::regprocedure AS func_name,
       CASE 
         WHEN pg_get_functiondef(p.oid) ILIKE '%functions_url(%' 
              AND pg_get_functiondef(p.oid) ILIKE '%Content-Type%application/json%'
              AND pg_get_functiondef(p.oid) NOT ILIKE '%Authorization%Bearer%'
         THEN 'PASS'
         ELSE 'FAIL'
       END as status
FROM pg_proc p
JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public'
  AND p.proname IN (
    'create_price_offer_notification',
    'notify_registered_order_status',
    'notify_on_order_creation',
    'notify_admins_new_pending_user',
    'notify_user_verification_status_change',
    'create_price_offer_status_notification',
    'admin_resend_welcome',
    'notify_on_seller_confirmation',
    'notify_on_product_status_changes',
    'notify_pusher_price_offer_changes',
    'notify_seller_product_sold'
  )
ORDER BY func_name;