-- Migrate to QStash Queue API (from Endpoint API)
-- Updates app_settings with new QStash credentials and queue configuration

-- Update QStash token to new value
UPDATE app_settings 
SET value = 'eyJVc2VySUQiOiJjMzQzYzAxYi0yMDlhLTRhZjMtYmJjNS1hOTk2YzYwZTdmZjQiLCJQYXNzd29yZCI6ImNiNWZjZmYyMmIzNTRkZjk4YTk3NTI3NGEzZjM2Mzc1In0=',
    updated_at = NOW()
WHERE key = 'qstash_token';

-- Add queue name (replaces endpoint-based approach)
INSERT INTO app_settings (key, value)
VALUES ('qstash_queue_name', 'telegram-notification-queue')
ON CONFLICT (key) 
DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Add signing keys for QStash webhook verification
INSERT INTO app_settings (key, value)
VALUES 
  ('qstash_current_signing_key', 'sig_6efUuZjFeCUEwQAth6n568e8cgMJ'),
  ('qstash_next_signing_key', 'sig_81KJRhs7sYQtKresv4UKXReTPxAX')
ON CONFLICT (key) 
DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Remove old endpoint-based setting (no longer needed with Queue API)
DELETE FROM app_settings WHERE key = 'qstash_endpoint_name';

-- Verify migration results
SELECT key, 
       CASE 
         WHEN key LIKE '%token%' OR key LIKE '%key%' THEN LEFT(value, 30) || '...'
         ELSE value 
       END as value_preview,
       updated_at
FROM app_settings 
WHERE key LIKE 'qstash%'
ORDER BY key;