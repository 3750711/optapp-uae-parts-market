-- Step 0: Backup current definitions
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
DO $autopatch$
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

    -- Replace URL patterns like url := 'https://api.partsbay.ae/functions/v1/function-name'
    patched := regexp_replace(
      src,
      'url\s*:=\s*''https?://[^'']*/functions/v1/([a-zA-Z0-9_\-]+)''',
      'url := public.functions_url(''\1'')',
      'gi'
    );

    -- Replace headers to remove Authorization and keep only Content-Type
    patched := regexp_replace(
      patched,
      'headers\s*:=\s*''[^'']*''::jsonb',
      'headers := ''{"Content-Type": "application/json"}''::jsonb',
      'gi'
    );

    -- Apply the patched definition
    EXECUTE patched;
    
    RAISE LOG 'Patched function: %', r.oid::regprocedure;
  END LOOP;
END $autopatch$;

-- Step 2: Verification checks (should return empty)
SELECT 'supabase.co check' as check_type, count(*) as count
FROM pg_proc p
JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public'
  AND pg_get_functiondef(p.oid) ILIKE '%supabase.co/functions/v1%';

SELECT 'direct functions/v1 check' as check_type, count(*) as count
FROM pg_proc p
JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public'
  AND pg_get_functiondef(p.oid) ILIKE '%/functions/v1/%'
  AND pg_get_functiondef(p.oid) NOT ILIKE '%functions_url(%';

SELECT 'net.http_post check' as check_type, count(*) as count
FROM pg_proc p
JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public'
  AND pg_get_functiondef(p.oid) ILIKE '%net.http_post%'
  AND pg_get_functiondef(p.oid) NOT ILIKE '%functions_url(%';

-- Step 3: Final verification of critical functions
SELECT p.oid::regprocedure AS func_name,
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
    'notify_on_product_status_changes'
  )
ORDER BY func_name;