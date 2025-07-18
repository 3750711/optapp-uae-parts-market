-- Fix notification system triggers and functions

-- 1. Fix the order notification function to actually create notifications
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
    'Получен новый заказ на товар "' || NEW.title || '" на сумму ' || NEW.price || ' AED',
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

-- 2. Fix the order status notification function
CREATE OR REPLACE FUNCTION public.create_order_status_notification()
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
      'ORDER_STATUS_CHANGE',
      'Изменение статуса заказа #' || NEW.order_number,
      'Статус вашего заказа изменен на: ' || NEW.status,
      jsonb_build_object(
        'order_id', NEW.id,
        'order_number', NEW.order_number,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'product_title', NEW.title
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fix the product status notification function  
CREATE OR REPLACE FUNCTION public.create_product_status_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger if status changed to 'active' or 'sold'
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('active', 'sold') THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      data
    ) VALUES (
      NEW.seller_id,
      'PRODUCT_STATUS_CHANGE',
      CASE 
        WHEN NEW.status = 'active' THEN 'Товар активирован'
        WHEN NEW.status = 'sold' THEN 'Товар продан'
        ELSE 'Изменение статуса товара'
      END,
      CASE 
        WHEN NEW.status = 'active' THEN 'Ваш товар "' || NEW.title || '" активирован и доступен для покупки'
        WHEN NEW.status = 'sold' THEN 'Ваш товар "' || NEW.title || '" продан'
        ELSE 'Статус товара "' || NEW.title || '" изменен на: ' || NEW.status
      END,
      jsonb_build_object(
        'product_id', NEW.id,
        'product_title', NEW.title,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'price', NEW.price
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Improve price offer notification function
CREATE OR REPLACE FUNCTION public.create_price_offer_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify seller about new price offer
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    NEW.seller_id,
    'NEW_PRICE_OFFER',
    'Новое предложение цены',
    'Получено предложение ' || NEW.offered_price || ' AED вместо ' || NEW.original_price || ' AED',
    jsonb_build_object(
      'offer_id', NEW.id,
      'product_id', NEW.product_id,
      'buyer_id', NEW.buyer_id,
      'offered_price', NEW.offered_price,
      'original_price', NEW.original_price,
      'message', NEW.message
    )
  );

  -- Also notify buyer that their offer was submitted
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
    'Ваше предложение ' || NEW.offered_price || ' AED отправлено продавцу',
    jsonb_build_object(
      'offer_id', NEW.id,
      'product_id', NEW.product_id,
      'seller_id', NEW.seller_id,
      'offered_price', NEW.offered_price,
      'original_price', NEW.original_price
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create price offer status change notification function
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
        WHEN NEW.status = 'accepted' THEN 'Ваше предложение ' || NEW.offered_price || ' AED принято продавцом'
        WHEN NEW.status = 'rejected' THEN 'Ваше предложение ' || NEW.offered_price || ' AED отклонено продавцом'
        WHEN NEW.status = 'expired' THEN 'Срок действия вашего предложения ' || NEW.offered_price || ' AED истек'
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
        'Вы приняли предложение ' || NEW.offered_price || ' AED',
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

-- 6. Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_new_order_notification ON public.orders;
DROP TRIGGER IF EXISTS trigger_order_status_notification ON public.orders;
DROP TRIGGER IF EXISTS trigger_product_status_notification ON public.products;
DROP TRIGGER IF EXISTS trigger_new_price_offer_notification ON public.price_offers;
DROP TRIGGER IF EXISTS trigger_price_offer_status_notification ON public.price_offers;

-- 7. Create all triggers
CREATE TRIGGER trigger_new_order_notification
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_order_notification();

CREATE TRIGGER trigger_order_status_notification
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_order_status_notification();

CREATE TRIGGER trigger_product_status_notification
  AFTER UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.create_product_status_notification();

CREATE TRIGGER trigger_new_price_offer_notification
  AFTER INSERT ON public.price_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.create_price_offer_notification();

CREATE TRIGGER trigger_price_offer_status_notification
  AFTER UPDATE ON public.price_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.create_price_offer_status_notification();