-- Create function to create notifications for new orders
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
      'price', NEW.price
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new orders
CREATE TRIGGER trigger_new_order_notification
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_order_notification();

-- Create function to create notifications for order status changes
CREATE OR REPLACE FUNCTION public.create_order_status_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification if status actually changed
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
      'Изменен статус заказа #' || NEW.order_number,
      'Статус заказа изменен с "' || OLD.status || '" на "' || NEW.status || '"',
      jsonb_build_object(
        'order_id', NEW.id,
        'order_number', NEW.order_number,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for order status changes
CREATE TRIGGER trigger_order_status_notification
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_order_status_notification();

-- Create function to create notifications for product status changes
CREATE OR REPLACE FUNCTION public.create_product_status_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification if status actually changed and it's going to active or sold
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
      'Изменен статус товара',
      'Статус товара "' || NEW.title || '" изменен на "' || NEW.status || '"',
      jsonb_build_object(
        'product_id', NEW.id,
        'product_title', NEW.title,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for product status changes
CREATE TRIGGER trigger_product_status_notification
  AFTER UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.create_product_status_notification();

-- Create function to create notifications for new price offers
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
    'PRICE_OFFER',
    'Новое предложение цены',
    'Получено предложение цены ' || NEW.offered_price || ' AED за товар',
    jsonb_build_object(
      'offer_id', NEW.id,
      'product_id', NEW.product_id,
      'offered_price', NEW.offered_price,
      'original_price', NEW.original_price,
      'buyer_id', NEW.buyer_id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new price offers
CREATE TRIGGER trigger_new_price_offer_notification
  AFTER INSERT ON public.price_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.create_price_offer_notification();