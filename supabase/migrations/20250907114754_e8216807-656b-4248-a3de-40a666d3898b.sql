-- Очистка дублирующихся функций и обеспечение корректных версий с functions_url()

-- 1. Полное удаление старых версий create_price_offer_notification
DROP FUNCTION IF EXISTS public.create_price_offer_notification(uuid, uuid, numeric);
DROP FUNCTION IF EXISTS public.create_price_offer_notification(p_buyer_id uuid, p_product_id uuid, p_offered_price numeric);

-- 2. Создание корректной версии create_price_offer_notification
CREATE OR REPLACE FUNCTION public.create_price_offer_notification(p_buyer_id uuid, p_product_id uuid, p_offered_price numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Send notification via Edge Function using functions_url()
  BEGIN
    PERFORM
      net.http_post(
        url := public.functions_url('notify-seller-new-price-offer'),
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := jsonb_build_object(
          'buyerId', p_buyer_id,
          'productId', p_product_id,
          'offeredPrice', p_offered_price
        )
      );
    RAISE LOG 'Price offer notification sent for buyer % and product %', p_buyer_id, p_product_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Error sending price offer notification: %', SQLERRM;
  END;
END;
$$;

-- 3. Полное удаление старых версий create_price_offer_status_notification
DROP FUNCTION IF EXISTS public.create_price_offer_status_notification(uuid, text, text);
DROP FUNCTION IF EXISTS public.create_price_offer_status_notification(p_offer_id uuid, p_status text, p_seller_response text);

-- 4. Создание корректной версии create_price_offer_status_notification
CREATE OR REPLACE FUNCTION public.create_price_offer_status_notification(p_offer_id uuid, p_status text, p_seller_response text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Send status update notification using functions_url()
  BEGIN
    PERFORM
      net.http_post(
        url := public.functions_url('notify-price-offer-status-change'),
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := jsonb_build_object(
          'offerId', p_offer_id,
          'status', p_status,
          'sellerResponse', p_seller_response
        )
      );
    RAISE LOG 'Price offer status notification sent for offer %', p_offer_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Error sending price offer status notification: %', SQLERRM;
  END;
END;
$$;