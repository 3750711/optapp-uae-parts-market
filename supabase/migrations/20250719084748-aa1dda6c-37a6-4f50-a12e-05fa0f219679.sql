
-- Добавляем новые типы уведомлений в существующий enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'NEW_PRODUCT';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'PRODUCT_STATUS_CHANGE';

-- Создаем функцию для создания внутренних уведомлений о товарах
CREATE OR REPLACE FUNCTION public.create_internal_product_notifications()
RETURNS TRIGGER AS $$
DECLARE
  admin_user RECORD;
  notification_title TEXT;
  notification_message TEXT;
  notification_type_val TEXT;
BEGIN
  -- Определяем тип уведомления и сообщения в зависимости от статуса
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    notification_type_val := 'NEW_PRODUCT';
    notification_title := 'Новый товар ожидает проверки';
    notification_message := 'Товар "' || NEW.title || '" от продавца ' || NEW.seller_name || ' ожидает проверки администратора';
    
    -- Уведомляем только администраторов о новых товарах на проверке
    FOR admin_user IN 
      SELECT id FROM profiles WHERE user_type = 'admin'
    LOOP
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        data
      ) VALUES (
        admin_user.id,
        notification_type_val,
        notification_title,
        notification_message,
        jsonb_build_object(
          'product_id', NEW.id,
          'product_title', NEW.title,
          'seller_name', NEW.seller_name,
          'seller_id', NEW.seller_id,
          'status', NEW.status,
          'price', NEW.price
        )
      );
    END LOOP;
    
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    notification_type_val := 'PRODUCT_STATUS_CHANGE';
    
    -- Уведомление продавцу об изменении статуса
    IF NEW.status = 'active' THEN
      notification_title := 'Товар активирован';
      notification_message := 'Ваш товар "' || NEW.title || '" одобрен и опубликован на сайте';
    ELSIF NEW.status = 'sold' THEN
      notification_title := 'Товар продан';
      notification_message := 'Ваш товар "' || NEW.title || '" помечен как проданный';
    ELSIF NEW.status = 'archived' THEN
      notification_title := 'Товар архивирован';
      notification_message := 'Ваш товар "' || NEW.title || '" перемещен в архив';
    ELSIF NEW.status = 'rejected' THEN
      notification_title := 'Товар отклонен';
      notification_message := 'Ваш товар "' || NEW.title || '" не прошел модерацию';
    ELSE
      notification_title := 'Изменен статус товара';
      notification_message := 'Статус товара "' || NEW.title || '" изменен на "' || NEW.status || '"';
    END IF;
    
    -- Уведомляем продавца
    INSERT INTO public.notifications (
      user_id,
      type,  
      title,
      message,
      data
    ) VALUES (
      NEW.seller_id,
      notification_type_val,
      notification_title,
      notification_message,
      jsonb_build_object(
        'product_id', NEW.id,
        'product_title', NEW.title,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'price', NEW.price
      )
    );
    
    -- Если товар создан, но еще не подтвержден - уведомляем продавца
    IF OLD.status = 'pending' AND NEW.status = 'pending' THEN
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        data
      ) VALUES (
        NEW.seller_id,
        'PRODUCT_STATUS_CHANGE',
        'Товар ожидает проверки',
        'Товар "' || NEW.title || '" ожидает проверки администратора, скоро он появится на сайте',
        jsonb_build_object(
          'product_id', NEW.id,
          'product_title', NEW.title,
          'status', NEW.status
        )
      );
    END IF;
    
  END IF;
  
  -- Логирование для диагностики
  RAISE LOG 'Product notification created: product_id=%, status=%, trigger_op=%', 
    NEW.id, NEW.status, TG_OP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Создаем триггер для внутренних уведомлений (отдельно от Telegram уведомлений)
DROP TRIGGER IF EXISTS trigger_internal_product_notifications ON public.products;
CREATE TRIGGER trigger_internal_product_notifications
  AFTER INSERT OR UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.create_internal_product_notifications();

-- Исправляем существующую функцию create_product_status_notification
CREATE OR REPLACE FUNCTION public.create_product_status_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Логирование для диагностики
  RAISE LOG 'create_product_status_notification called: product_id=%, old_status=%, new_status=%', 
    NEW.id, OLD.status, NEW.status;
    
  -- Только создаем уведомления при UPDATE и реальном изменении статуса
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Уведомляем продавца об изменении статуса товара
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
        WHEN NEW.status = 'archived' THEN 'Товар архивирован'
        WHEN NEW.status = 'rejected' THEN 'Товар отклонен'
        ELSE 'Изменение статуса товара'
      END,
      CASE 
        WHEN NEW.status = 'active' THEN 'Ваш товар "' || NEW.title || '" активирован и доступен для покупки'
        WHEN NEW.status = 'sold' THEN 'Ваш товар "' || NEW.title || '" продан'
        WHEN NEW.status = 'archived' THEN 'Ваш товар "' || NEW.title || '" перемещен в архив'
        WHEN NEW.status = 'rejected' THEN 'Ваш товар "' || NEW.title || '" не прошел модерацию'
        ELSE 'Статус товара "' || NEW.title || '" изменен на: ' || NEW.status
      END,
      jsonb_build_object(
        'product_id', NEW.id,
        'product_title', NEW.title,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'price', NEW.price,
        'seller_name', NEW.seller_name
      )
    );
    
    RAISE LOG 'Product status notification created for seller: %', NEW.seller_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Проверяем, что таблица notifications включена в realtime
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.notifications;

-- Добавляем индексы для оптимизации запросов уведомлений
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
