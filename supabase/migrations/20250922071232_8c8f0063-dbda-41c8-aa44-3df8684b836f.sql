-- Update service_role_key in app_settings for AI enrichment
UPDATE public.app_settings 
SET value = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDg5MTAyNSwiZXhwIjoyMDYwNDY3MDI1fQ.c0LD3qUvGU7suF4DXGOWQkm7r7Dm6SQ5eWUgdl7qBSg',
    updated_at = now()
WHERE key = 'service_role_key';

-- Insert if doesn't exist
INSERT INTO public.app_settings (key, value, created_at, updated_at)
SELECT 'service_role_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDg5MTAyNSwiZXhwIjoyMDYwNDY3MDI1fQ.c0LD3qUvGU7suF4DXGOWQkm7r7Dm6SQ5eWUgdl7qBSg', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.app_settings WHERE key = 'service_role_key');