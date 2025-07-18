-- Fix price offer notifications - remove duplicate and change currency

-- Update price offer notification function to remove duplicate buyer notification and change AED to $
CREATE OR REPLACE FUNCTION public.create_price_offer_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify seller about new price offer (keep this one)
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
    'Получено предложение $' || NEW.offered_price || ' вместо $' || NEW.original_price,
    jsonb_build_object(
      'offer_id', NEW.id,
      'product_id', NEW.product_id,
      'buyer_id', NEW.buyer_id,
      'offered_price', NEW.offered_price,
      'original_price', NEW.original_price,
      'message', NEW.message
    )
  );

  -- Remove the duplicate buyer notification (PRICE_OFFER_SUBMITTED)
  -- Only seller gets notified about new offers
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update price offer status notification function to change AED to $
CREATE OR REPLACE FUNCTION public.create_price_offer_status_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Notify buyer about status change
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      data
    ) VALUES (
      NEW.buyer_id,
      'PRICE_OFFER_RESPONSE',
      CASE 
        WHEN NEW.status = 'accepted' THEN 'Предложение принято'
        WHEN NEW.status = 'rejected' THEN 'Предложение отклонено'
        WHEN NEW.status = 'expired' THEN 'Предложение истекло'
        ELSE 'Изменение статуса предложения'
      END,
      CASE 
        WHEN NEW.status = 'accepted' THEN 'Ваше предложение $' || NEW.offered_price || ' принято продавцом'
        WHEN NEW.status = 'rejected' THEN 'Ваше предложение $' || NEW.offered_price || ' отклонено продавцом'
        WHEN NEW.status = 'expired' THEN 'Срок действия вашего предложения $' || NEW.offered_price || ' истек'
        ELSE 'Статус вашего предложения изменен на: ' || NEW.status
      END,
      jsonb_build_object(
        'offer_id', NEW.id,
        'product_id', NEW.product_id,
        'seller_id', NEW.seller_id,
        'offered_price', NEW.offered_price,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'seller_response', NEW.seller_response
      )
    );

    -- If accepted, also notify seller
    IF NEW.status = 'accepted' THEN
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        data
      ) VALUES (
        NEW.seller_id,
        'PRICE_OFFER_ACCEPTED',
        'Предложение принято',
        'Вы приняли предложение $' || NEW.offered_price,
        jsonb_build_object(
          'offer_id', NEW.id,
          'product_id', NEW.product_id,
          'buyer_id', NEW.buyer_id,
          'offered_price', NEW.offered_price
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update order notification function to change AED to $
CREATE OR REPLACE FUNCTION public.create_order_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify seller about new order
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    NEW.seller_id,
    'NEW_ORDER',
    'Новый заказ #' || NEW.order_number,
    'Получен новый заказ на товар "' || NEW.title || '" на сумму $' || NEW.price,
    jsonb_build_object(
      'order_id', NEW.id,
      'order_number', NEW.order_number,
      'product_title', NEW.title,
      'price', NEW.price,
      'buyer_id', NEW.buyer_id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;