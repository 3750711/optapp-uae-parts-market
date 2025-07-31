-- Update the auto approval function to handle admin-created products
CREATE OR REPLACE FUNCTION public.auto_approve_trusted_seller_products()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
    -- For trusted sellers, set status to active
    NEW.status = 'active';
    is_trusted := TRUE;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS trigger_auto_approve_trusted_seller_products ON public.products;
CREATE TRIGGER trigger_auto_approve_trusted_seller_products
BEFORE INSERT ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.auto_approve_trusted_seller_products();