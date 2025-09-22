-- Create trigger function for automatic AI enrichment on product insert
CREATE OR REPLACE FUNCTION public.trigger_ai_enrichment_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Only trigger for pending products without AI enrichment
  IF NEW.status = 'pending' AND NEW.ai_enriched_at IS NULL THEN
    -- Asynchronously call AI enrichment edge function
    BEGIN
      PERFORM
        net.http_post(
          url := public.functions_url('/functions/v1/ai-enrich-product'),
          headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.anon_key', true) || '"}'::jsonb,
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

-- Create trigger on products table
DROP TRIGGER IF EXISTS trigger_auto_ai_enrichment ON public.products;
CREATE TRIGGER trigger_auto_ai_enrichment
  AFTER INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_ai_enrichment_on_insert();