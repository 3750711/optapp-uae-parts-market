-- Add buyer notification back to price offer creation function
CREATE OR REPLACE FUNCTION public.create_price_offer_notification()
RETURNS TRIGGER AS $$
DECLARE
  product_title text;
  product_brand text;
  product_model text;
BEGIN
  -- Get product details for informative notification
  SELECT title, brand, model 
  INTO product_title, product_brand, product_model
  FROM public.products 
  WHERE id = NEW.product_id;

  -- Notify seller about new price offer
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    NEW.seller_id,
    'PRICE_OFFER',
    'Новое предложение цены',
    'Получено предложение $' || NEW.offered_price || ' вместо $' || NEW.original_price || ' на товар "' || COALESCE(product_title, 'Неизвестный товар') || '"',
    jsonb_build_object(
      'offer_id', NEW.id,
      'product_id', NEW.product_id,
      'buyer_id', NEW.buyer_id,
      'offered_price', NEW.offered_price,
      'original_price', NEW.original_price,
      'message', NEW.message,
      'product_title', product_title
    )
  );

  -- Notify buyer about their price offer submission (informative confirmation)
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    NEW.buyer_id,
    'PRICE_OFFER_SUBMITTED',
    'Предложение отправлено',
    'Ваше предложение $' || NEW.offered_price || ' (вместо $' || NEW.original_price || ') на товар "' || COALESCE(product_title, 'Неизвестный товар') || '" (' || COALESCE(product_brand, '') || CASE WHEN product_model IS NOT NULL THEN ' ' || product_model ELSE '' END || ') отправлено продавцу',
    jsonb_build_object(
      'offer_id', NEW.id,
      'product_id', NEW.product_id,
      'seller_id', NEW.seller_id,
      'offered_price', NEW.offered_price,
      'original_price', NEW.original_price,
      'message', NEW.message,
      'product_title', product_title,
      'product_brand', product_brand,
      'product_model', product_model
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;