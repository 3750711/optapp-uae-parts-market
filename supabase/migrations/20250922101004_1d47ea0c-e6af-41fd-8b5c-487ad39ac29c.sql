-- Add anon_key setting for trigger authentication
INSERT INTO public.app_settings (key, value) 
VALUES ('supabase_anon_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = now();

-- Update trigger function to use stored anon key
CREATE OR REPLACE FUNCTION public.trigger_ai_enrichment_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  anon_key text;
BEGIN
  -- Only trigger for pending products without AI enrichment
  IF NEW.status = 'pending' AND NEW.ai_enriched_at IS NULL THEN
    -- Get anon key from settings
    SELECT value INTO anon_key
    FROM public.app_settings
    WHERE key = 'supabase_anon_key';
    
    -- Asynchronously call AI enrichment edge function
    BEGIN
      PERFORM
        net.http_post(
          url := public.functions_url('/functions/v1/ai-enrich-product'),
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || COALESCE(anon_key, '')
          ),
          body := jsonb_build_object(
            'product_id', NEW.id,
            'title', NEW.title,
            'auto_trigger', true,
            'triggered_by', 'database_insert'
          )
        );
      
      RAISE LOG 'Triggered AI enrichment for product %: "%"', NEW.id, NEW.title;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the insert
      RAISE LOG 'Failed to trigger AI enrichment for product %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;