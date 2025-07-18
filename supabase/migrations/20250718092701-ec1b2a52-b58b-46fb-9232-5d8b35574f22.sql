-- Add triggers for ADMIN_MESSAGE notifications (связать с message_history)
CREATE OR REPLACE FUNCTION public.create_admin_message_notification()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
BEGIN
  -- Create notifications for each recipient when admin sends a message
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = NEW.sender_id 
    AND user_type = 'admin'
  ) THEN
    -- Create notification for each recipient
    FOREACH recipient_id IN ARRAY NEW.recipient_ids
    LOOP
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        data
      ) VALUES (
        recipient_id,
        'ADMIN_MESSAGE',
        'Сообщение от администратора',
        LEFT(NEW.message_text, 100) || CASE WHEN LENGTH(NEW.message_text) > 100 THEN '...' ELSE '' END,
        jsonb_build_object(
          'message_id', NEW.id,
          'sender_id', NEW.sender_id
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for admin messages
CREATE TRIGGER trigger_admin_message_notification
  AFTER INSERT ON public.message_history
  FOR EACH ROW
  EXECUTE FUNCTION public.create_admin_message_notification();

-- Add trigger for PROFILE_UPDATE notifications
CREATE OR REPLACE FUNCTION public.create_profile_update_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify user about important profile changes (verification status, user type changes)
  IF OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      data
    ) VALUES (
      NEW.id,
      'PROFILE_UPDATE',
      'Изменен статус верификации',
      'Статус верификации изменен на "' || NEW.verification_status || '"',
      jsonb_build_object(
        'profile_id', NEW.id,
        'old_status', OLD.verification_status,
        'new_status', NEW.verification_status
      )
    );
  END IF;
  
  IF OLD.user_type IS DISTINCT FROM NEW.user_type THEN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      data
    ) VALUES (
      NEW.id,
      'PROFILE_UPDATE',
      'Изменен тип пользователя',
      'Тип пользователя изменен на "' || NEW.user_type || '"',
      jsonb_build_object(
        'profile_id', NEW.id,
        'old_type', OLD.user_type,
        'new_type', NEW.user_type
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for profile updates
CREATE TRIGGER trigger_profile_update_notification
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_profile_update_notification();

-- Add trigger for price offer expiration and status changes
CREATE OR REPLACE FUNCTION public.create_price_offer_status_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify when price offer status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Notify buyer about offer status change
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      data
    ) VALUES (
      NEW.buyer_id,
      'PRICE_OFFER',
      CASE 
        WHEN NEW.status = 'accepted' THEN 'Предложение цены принято'
        WHEN NEW.status = 'rejected' THEN 'Предложение цены отклонено'
        WHEN NEW.status = 'expired' THEN 'Предложение цены истекло'
        ELSE 'Изменен статус предложения цены'
      END,
      CASE 
        WHEN NEW.status = 'accepted' THEN 'Ваше предложение цены ' || NEW.offered_price || ' AED было принято продавцом'
        WHEN NEW.status = 'rejected' THEN 'Ваше предложение цены ' || NEW.offered_price || ' AED было отклонено продавцом'
        WHEN NEW.status = 'expired' THEN 'Время действия вашего предложения цены ' || NEW.offered_price || ' AED истекло'
        ELSE 'Статус вашего предложения цены изменен на "' || NEW.status || '"'
      END,
      jsonb_build_object(
        'offer_id', NEW.id,
        'product_id', NEW.product_id,
        'offered_price', NEW.offered_price,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
    
    -- Also notify seller if offer was accepted/rejected (not expired)
    IF NEW.status IN ('accepted', 'rejected') THEN
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        data
      ) VALUES (
        NEW.seller_id,
        'PRICE_OFFER',
        CASE 
          WHEN NEW.status = 'accepted' THEN 'Предложение цены принято'
          WHEN NEW.status = 'rejected' THEN 'Предложение цены отклонено'
        END,
        CASE 
          WHEN NEW.status = 'accepted' THEN 'Вы приняли предложение цены ' || NEW.offered_price || ' AED'
          WHEN NEW.status = 'rejected' THEN 'Вы отклонили предложение цены ' || NEW.offered_price || ' AED'
        END,
        jsonb_build_object(
          'offer_id', NEW.id,
          'product_id', NEW.product_id,
          'offered_price', NEW.offered_price,
          'buyer_id', NEW.buyer_id,
          'status', NEW.status
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for price offer status changes
CREATE TRIGGER trigger_price_offer_status_notification
  AFTER UPDATE ON public.price_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.create_price_offer_status_notification();

-- Add function to create order reminder notifications
CREATE OR REPLACE FUNCTION public.create_order_reminder_notifications()
RETURNS void AS $$
DECLARE
  order_record RECORD;
BEGIN
  -- Find orders that need status updates (older than 24 hours in certain statuses)
  FOR order_record IN 
    SELECT o.*, p.full_name as buyer_name
    FROM orders o
    JOIN profiles p ON p.id = o.buyer_id
    WHERE o.status IN ('created', 'seller_confirmed') 
    AND o.created_at < NOW() - INTERVAL '24 hours'
    AND (o.last_notification_sent_at IS NULL OR o.last_notification_sent_at < NOW() - INTERVAL '24 hours')
  LOOP
    -- Notify seller about pending order
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      data
    ) VALUES (
      order_record.seller_id,
      'ORDER_STATUS_CHANGE',
      'Напоминание о заказе #' || order_record.order_number,
      'Заказ #' || order_record.order_number || ' ожидает обработки уже более 24 часов',
      jsonb_build_object(
        'order_id', order_record.id,
        'order_number', order_record.order_number,
        'status', order_record.status,
        'reminder_type', 'pending_order'
      )
    );
    
    -- Update last notification sent timestamp
    UPDATE orders 
    SET last_notification_sent_at = NOW() 
    WHERE id = order_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;