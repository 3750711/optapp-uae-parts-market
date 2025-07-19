
-- Добавляем новые типы уведомлений для заказов
-- ORDER_CREATED - для покупателя при создании заказа
-- ORDER_CONFIRMATION - для покупателя при подтверждении заказа продавцом

-- Обновляем функцию уведомления о создании заказа
-- Теперь она будет уведомлять И продавца И покупателя
CREATE OR REPLACE FUNCTION public.create_order_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Уведомляем продавца о новом заказе
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

  -- Уведомляем покупателя о создании заказа
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    data
  ) VALUES (
    NEW.buyer_id,
    'ORDER_CREATED',
    'Заказ создан #' || NEW.order_number,
    'Ваш заказ на товар "' || NEW.title || '" успешно создан. Ожидайте подтверждения от продавца.',
    jsonb_build_object(
      'order_id', NEW.id,
      'order_number', NEW.order_number,
      'product_title', NEW.title,
      'price', NEW.price,
      'seller_id', NEW.seller_id,
      'status', NEW.status
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Улучшаем функцию уведомления об изменении статуса заказа
-- Теперь она будет отправлять уведомления обеим сторонам с разными сообщениями
CREATE OR REPLACE FUNCTION public.create_order_status_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Только если статус действительно изменился
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    
    -- Уведомляем покупателя об изменении статуса
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      data
    ) VALUES (
      NEW.buyer_id,
      CASE 
        WHEN NEW.status = 'seller_confirmed' THEN 'ORDER_CONFIRMATION'
        ELSE 'ORDER_STATUS_CHANGE'
      END,
      CASE 
        WHEN NEW.status = 'seller_confirmed' THEN 'Заказ подтвержден продавцом #' || NEW.order_number
        WHEN NEW.status = 'admin_confirmed' THEN 'Заказ подтвержден администратором #' || NEW.order_number
        WHEN NEW.status = 'processed' THEN 'Заказ зарегистрирован #' || NEW.order_number
        WHEN NEW.status = 'shipped' THEN 'Заказ отправлен #' || NEW.order_number
        WHEN NEW.status = 'delivered' THEN 'Заказ доставлен #' || NEW.order_number
        WHEN NEW.status = 'cancelled' THEN 'Заказ отменен #' || NEW.order_number
        ELSE 'Изменение статуса заказа #' || NEW.order_number
      END,
      CASE 
        WHEN NEW.status = 'seller_confirmed' THEN 'Продавец подтвердил ваш заказ на товар "' || NEW.title || '". Ожидайте дальнейших инструкций.'
        WHEN NEW.status = 'admin_confirmed' THEN 'Администратор подтвердил ваш заказ на товар "' || NEW.title || '".'
        WHEN NEW.status = 'processed' THEN 'Ваш заказ на товар "' || NEW.title || '" зарегистрирован и передан в обработку.'
        WHEN NEW.status = 'shipped' THEN 'Ваш заказ на товар "' || NEW.title || '" отправлен.'
        WHEN NEW.status = 'delivered' THEN 'Ваш заказ на товар "' || NEW.title || '" доставлен.'
        WHEN NEW.status = 'cancelled' THEN 'Ваш заказ на товар "' || NEW.title || '" отменен.'
        ELSE 'Статус вашего заказа на товар "' || NEW.title || '" изменен на: ' || NEW.status
      END,
      jsonb_build_object(
        'order_id', NEW.id,
        'order_number', NEW.order_number,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'product_title', NEW.title,
        'seller_id', NEW.seller_id
      )
    );

    -- Уведомляем продавца об изменении статуса (кроме начального создания)
    IF OLD.status != 'created' OR NEW.status != 'seller_confirmed' THEN
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        data
      ) VALUES (
        NEW.seller_id,
        'ORDER_STATUS_CHANGE',
        CASE 
          WHEN NEW.status = 'admin_confirmed' THEN 'Заказ подтвержден администратором #' || NEW.order_number
          WHEN NEW.status = 'processed' THEN 'Заказ зарегистрирован #' || NEW.order_number
          WHEN NEW.status = 'shipped' THEN 'Заказ отправлен #' || NEW.order_number
          WHEN NEW.status = 'delivered' THEN 'Заказ доставлен #' || NEW.order_number
          WHEN NEW.status = 'cancelled' THEN 'Заказ отменен #' || NEW.order_number
          ELSE 'Изменение статуса заказа #' || NEW.order_number
        END,
        CASE 
          WHEN NEW.status = 'admin_confirmed' THEN 'Администратор подтвердил заказ на товар "' || NEW.title || '".'
          WHEN NEW.status = 'processed' THEN 'Заказ на товар "' || NEW.title || '" зарегистрирован.'
          WHEN NEW.status = 'shipped' THEN 'Заказ на товар "' || NEW.title || '" отправлен покупателю.'
          WHEN NEW.status = 'delivered' THEN 'Заказ на товар "' || NEW.title || '" доставлен покупателю.'
          WHEN NEW.status = 'cancelled' THEN 'Заказ на товар "' || NEW.title || '" отменен.'
          ELSE 'Статус заказа на товар "' || NEW.title || '" изменен на: ' || NEW.status
        END,
        jsonb_build_object(
          'order_id', NEW.id,
          'order_number', NEW.order_number,
          'old_status', OLD.status,
          'new_status', NEW.status,
          'product_title', NEW.title,
          'buyer_id', NEW.buyer_id
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем функцию для создания уведомлений о подтверждении заказа
-- Эта функция будет вызываться когда продавец подтверждает заказ
CREATE OR REPLACE FUNCTION public.create_order_confirmation_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Только если статус изменился на seller_confirmed
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'seller_confirmed' THEN
    
    -- Специальное уведомление покупателю о подтверждении заказа продавцом
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      data
    ) VALUES (
      NEW.buyer_id,
      'ORDER_CONFIRMATION',
      'Заказ подтвержден #' || NEW.order_number,
      'Продавец подтвердил ваш заказ на товар "' || NEW.title || '" на сумму $' || NEW.price || '. Ожидайте дальнейших инструкций по оплате и доставке.',
      jsonb_build_object(
        'order_id', NEW.id,
        'order_number', NEW.order_number,
        'product_title', NEW.title,
        'price', NEW.price,
        'seller_id', NEW.seller_id,
        'delivery_method', NEW.delivery_method,
        'delivery_price', NEW.delivery_price_confirm
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем триггер для уведомлений о подтверждении заказа
CREATE TRIGGER trigger_order_confirmation_notification
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.create_order_confirmation_notification();
