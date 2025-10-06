-- Fix functions_base_url to correct proxy domain
UPDATE public.app_settings 
SET value = 'https://api.partsbay.ae', 
    updated_at = now()
WHERE key = 'functions_base_url';