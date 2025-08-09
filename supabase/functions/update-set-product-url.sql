-- Update set_product_url to use partsbay.ae
CREATE OR REPLACE FUNCTION public.set_product_url()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Construct the full URL using the custom domain
  NEW.product_url := 'https://partsbay.ae/product/' || NEW.id;
  RETURN NEW;
END;
$function$;
