-- Remove duplicate AI processing triggers, keeping only the working one

-- Drop the duplicate triggers
DROP TRIGGER IF EXISTS trigger_auto_ai_enrichment ON public.products;
DROP TRIGGER IF EXISTS trigger_product_ai_enrichment ON public.products;

-- Drop the unused function
DROP FUNCTION IF EXISTS public.trigger_ai_enrichment_on_insert();

-- Verify the working trigger remains: products_ai_enrichment_trigger -> trigger_ai_enrichment()
-- This trigger should remain active and working

-- Add a comment to document the remaining trigger
COMMENT ON TRIGGER products_ai_enrichment_trigger ON public.products IS 'AI enrichment trigger - calls trigger_ai_enrichment() function';