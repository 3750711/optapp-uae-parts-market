-- Create trigger for automatic AI enrichment on product creation
CREATE OR REPLACE FUNCTION public.trigger_ai_enrichment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for new products that haven't been AI enriched yet
  IF NEW.ai_enriched_at IS NULL AND NEW.title IS NOT NULL THEN
    -- Call AI enrichment Edge Function asynchronously
    BEGIN
      PERFORM
        net.http_post(
          url := public.functions_url('/functions/v1/ai-enrich-product'),
          headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key', true) || '"}'::jsonb,
          body := jsonb_build_object(
            'product_id', NEW.id,
            'title', NEW.title,
            'brand', NEW.brand,
            'model', NEW.model,
            'auto_trigger', true
          )
        );
      RAISE LOG 'AI enrichment triggered for product %', NEW.id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Error triggering AI enrichment for product %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires after INSERT on products
CREATE TRIGGER trigger_product_ai_enrichment
  AFTER INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_ai_enrichment();

-- Add app setting for service role key (will be set by admin)
INSERT INTO public.app_settings (key, value)
VALUES ('service_role_key', '')
ON CONFLICT (key) DO NOTHING;

-- Update auto_approve function to consider AI confidence
CREATE OR REPLACE FUNCTION public.auto_approve_trusted_seller_products()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  is_trusted BOOLEAN := FALSE;
  is_admin_user BOOLEAN := FALSE;
BEGIN
  -- Check if current user is an admin
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) INTO is_admin_user;
  
  -- If admin is creating the product, set status to active immediately
  IF is_admin_user THEN
    NEW.status = 'active';
    RETURN NEW;
  END IF;
  
  -- Get email from seller's profile for trusted seller check
  SELECT email INTO user_email
  FROM public.profiles
  WHERE id = NEW.seller_id;
  
  -- Check trusted sellers list
  IF user_email IN (
    'geoo1999@mail.ru',
    'bahtin4ik409@yandex.ru',
    'Mail-igorek@mail.ru',
    'Mironenkonastya1997@mail.ru',
    'dorovskikh.toni@bk.ru',
    'ts12@g.com',
    'fa@g.com'
  ) OR NEW.telegram_url IN (
    'Elena_gult',
    'SanSanichUAE',
    'OptSeller_Georgii',
    'Nastya_PostingLots_OptCargo',
    'OptSeller_IgorK',
    'faruknose'
  ) THEN
    is_trusted := TRUE;
  END IF;
  
  -- Auto-approve logic based on trust level and AI confidence
  IF is_trusted THEN
    -- Trusted sellers: auto-approve immediately
    NEW.status = 'active';
    NEW.requires_moderation = FALSE;
  ELSIF NEW.ai_confidence IS NOT NULL AND NEW.ai_confidence >= 0.95 THEN
    -- High AI confidence: auto-approve
    NEW.status = 'active';
    NEW.requires_moderation = FALSE;
  ELSIF NEW.ai_confidence IS NOT NULL AND NEW.ai_confidence >= 0.80 THEN
    -- Medium AI confidence: reduce moderation priority
    NEW.requires_moderation = TRUE;
  ELSE
    -- Low or no AI confidence: full moderation required
    NEW.requires_moderation = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;