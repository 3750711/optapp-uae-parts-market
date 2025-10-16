-- Add QStash endpoint name configuration to app_settings
-- This allows configuring the QStash URL endpoint name without code changes

INSERT INTO public.app_settings (key, value, created_at, updated_at)
VALUES (
  'qstash_endpoint_name',
  'partsbay-repost',
  now(),
  now()
)
ON CONFLICT (key) DO UPDATE 
SET 
  value = EXCLUDED.value,
  updated_at = now();

COMMENT ON TABLE public.app_settings IS 'Application-wide configuration settings';
COMMENT ON COLUMN public.app_settings.key IS 'Configuration key identifier';
COMMENT ON COLUMN public.app_settings.value IS 'Configuration value';

-- Add comment for the new setting
DO $$
BEGIN
  -- We can't add column-specific comments for individual rows, but we can document it here
  RAISE NOTICE 'Added qstash_endpoint_name setting: QStash URL endpoint name for repost notifications';
  RAISE NOTICE 'Make sure to create a URL endpoint in Upstash QStash Console with this name';
  RAISE NOTICE 'URL for the endpoint should be: https://api.partsbay.ae/functions/v1/upstash-repost-handler';
END $$;