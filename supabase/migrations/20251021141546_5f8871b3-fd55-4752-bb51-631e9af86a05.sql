-- Migration: Switch QStash from Queue API to Direct Publish API
-- This simplifies the architecture by removing intermediate queue layer
-- while maintaining retry and deduplication features

-- Add QStash endpoint URL for Direct Publish API
INSERT INTO app_settings (key, value)
VALUES (
  'qstash_endpoint_url',
  'https://api.partsbay.ae/functions/v1/telegram-queue-handler'
)
ON CONFLICT (key) 
DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- Verify settings
DO $$
DECLARE
  token_value TEXT;
  endpoint_value TEXT;
BEGIN
  SELECT value INTO token_value FROM app_settings WHERE key = 'qstash_token';
  SELECT value INTO endpoint_value FROM app_settings WHERE key = 'qstash_endpoint_url';
  
  IF token_value IS NOT NULL AND endpoint_value IS NOT NULL THEN
    RAISE NOTICE '✅ QStash Direct Publish configured';
    RAISE NOTICE 'Token: %', LEFT(token_value, 20) || '...';
    RAISE NOTICE 'Endpoint: %', endpoint_value;
  ELSE
    RAISE WARNING '❌ QStash configuration incomplete';
    IF token_value IS NULL THEN
      RAISE WARNING 'Missing qstash_token';
    END IF;
    IF endpoint_value IS NULL THEN
      RAISE WARNING 'Missing qstash_endpoint_url';
    END IF;
  END IF;
END $$;