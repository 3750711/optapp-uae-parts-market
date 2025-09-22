-- Create trigger for AI enrichment of new products
DROP TRIGGER IF EXISTS trigger_product_ai_enrichment ON public.products;

-- Recreate the trigger function with proper service role key support
CREATE OR REPLACE FUNCTION public.trigger_ai_enrichment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  service_key text;
BEGIN
  -- Only trigger for new products that haven't been AI enriched yet
  IF NEW.ai_enriched_at IS NULL AND NEW.title IS NOT NULL THEN
    -- Get service role key from app_settings
    SELECT value INTO service_key
    FROM public.app_settings
    WHERE key = 'service_role_key';
    
    IF service_key IS NULL OR service_key = '' THEN
      RAISE LOG 'Service role key not found in app_settings, skipping AI enrichment for product %', NEW.id;
      RETURN NEW;
    END IF;
    
    -- Call AI enrichment Edge Function asynchronously
    BEGIN
      PERFORM
        net.http_post(
          url := public.functions_url('/functions/v1/ai-enrich-product'),
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || service_key
          ),
          body := jsonb_build_object(
            'product_id', NEW.id,
            'title', NEW.title,
            'brand', NEW.brand,
            'model', NEW.model,
            'auto_trigger', true
          )
        );
      RAISE LOG 'AI enrichment triggered for new product %: "%"', NEW.id, NEW.title;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Error triggering AI enrichment for product %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the trigger for new products only
CREATE TRIGGER trigger_product_ai_enrichment
  AFTER INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_ai_enrichment();