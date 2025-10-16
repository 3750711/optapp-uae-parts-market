-- Update QSTASH_TOKEN in app_settings for automatic product notifications routing
UPDATE public.app_settings
SET 
  value = 'eyJVc2VySUQiOiJjMzQzYzAxYi0yMDlhLTRhZjMtYmJjNS1hOTk2YzYwZTdmZjQiLCJQYXNzd29yZCI6ImNiNWZjZmYyMmIzNTRkZjk4YTk3NTI3NGEzZjM2Mzc1In0=',
  updated_at = now()
WHERE key = 'qstash_token';