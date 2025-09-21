-- Add catalog_position field for product sorting in catalog
ALTER TABLE public.products 
ADD COLUMN catalog_position TIMESTAMP WITH TIME ZONE;

-- Set initial values to created_at for existing products
UPDATE public.products 
SET catalog_position = created_at 
WHERE catalog_position IS NULL;

-- Make the column NOT NULL with default value
ALTER TABLE public.products 
ALTER COLUMN catalog_position SET NOT NULL;

ALTER TABLE public.products 
ALTER COLUMN catalog_position SET DEFAULT now();

-- Create index for efficient sorting
CREATE INDEX idx_products_catalog_position ON public.products(catalog_position DESC);

-- Update trigger to set catalog_position on insert
CREATE OR REPLACE FUNCTION public.set_catalog_position_on_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Set catalog_position to created_at on new product creation
  IF NEW.catalog_position IS NULL THEN
    NEW.catalog_position := NEW.created_at;
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger for new products
DROP TRIGGER IF EXISTS set_catalog_position_trigger ON public.products;
CREATE TRIGGER set_catalog_position_trigger
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_catalog_position_on_insert();