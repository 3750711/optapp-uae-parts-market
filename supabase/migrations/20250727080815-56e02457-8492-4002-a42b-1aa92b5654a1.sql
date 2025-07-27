-- Add logging to notify_on_product_status_changes function
CREATE OR REPLACE FUNCTION public.notify_on_product_status_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RAISE LOG 'Product status change trigger fired: OLD.status=%, NEW.status=%, product_id=%', 
    COALESCE(OLD.status::text, 'NULL'), NEW.status, NEW.id;
  
  -- Only notify on status changes, not inserts
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    RAISE LOG 'Creating bilingual notification for product % status change from % to %', 
      NEW.id, OLD.status, NEW.status;
    
    -- Try to create bilingual notification and log result
    BEGIN
      PERFORM create_bilingual_notification(
        NEW.seller_id,
        'PRODUCT_STATUS_CHANGE',
        jsonb_build_object(
          'product_id', NEW.id,
          'title', NEW.title,
          'old_status', OLD.status,
          'status', NEW.status,
          'url', '/product/' || NEW.id
        )
      );
      
      RAISE LOG 'Successfully created bilingual notification for product %', NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'Error creating bilingual notification for product %: %', NEW.id, SQLERRM;
    END;
    
    -- Add direct Edge Function call for Telegram notification
    BEGIN
      -- Update timestamp first
      NEW.last_notification_sent_at := NOW();
      
      -- Call edge function directly for Telegram notification
      PERFORM
        net.http_post(
          url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/send-telegram-notification',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || 
                   current_setting('app.settings.service_role_key', true) || '"}',
          body:=jsonb_build_object(
            'action', 'status_change',
            'productId', NEW.id,
            'type', 'product'
          )::text
        );
      
      RAISE LOG 'Called Edge Function for product % Telegram notification', NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'Error calling Edge Function for product %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Add enhanced logging to create_bilingual_notification function
CREATE OR REPLACE FUNCTION public.create_bilingual_notification(p_user_id uuid, p_type text, p_data jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  translation_result jsonb;
  notification_id uuid;
BEGIN
  RAISE LOG 'Creating bilingual notification: user_id=%, type=%, data=%', p_user_id, p_type, p_data;
  
  -- Get translations
  BEGIN
    translation_result := translate_notification(p_type, p_data, p_user_id);
    RAISE LOG 'Translation result: %', translation_result;
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error in translate_notification: %', SQLERRM;
    RAISE;
  END;
  
  -- Insert notification with all language variants
  BEGIN
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      message,
      title_en,
      message_en,
      language,
      data
    ) VALUES (
      p_user_id,
      p_type,
      translation_result->>'title',
      translation_result->>'message',
      translation_result->>'title_en',
      translation_result->>'message_en',
      translation_result->>'language',
      p_data
    ) RETURNING id INTO notification_id;
    
    RAISE LOG 'Successfully created notification with ID: %', notification_id;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error inserting notification: %', SQLERRM;
    RAISE;
  END;
  
  RETURN notification_id;
END;
$function$;

-- Add logging to translate_notification function
CREATE OR REPLACE FUNCTION public.translate_notification(p_type text, p_data jsonb, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  result jsonb;
  user_type_val text;
  title_ru text;
  title_en text;
  message_ru text;
  message_en text;
  language_val text;
BEGIN
  RAISE LOG 'Translating notification: type=%, user_id=%, data=%', p_type, p_user_id, p_data;
  
  -- Get user type if user_id provided
  IF p_user_id IS NOT NULL THEN
    SELECT user_type INTO user_type_val
    FROM public.profiles
    WHERE id = p_user_id;
    
    RAISE LOG 'User type for %: %', p_user_id, user_type_val;
  END IF;
  
  -- Set language based on user type
  language_val := CASE 
    WHEN user_type_val = 'seller' THEN 'en'
    ELSE 'ru'
  END;
  
  RAISE LOG 'Language selected: %', language_val;
  
  -- Generate titles and messages based on notification type
  CASE p_type
    WHEN 'PRODUCT_STATUS_CHANGE' THEN
      title_ru := 'Изменение статуса товара';
      title_en := 'Product Status Changed';
      message_ru := 'Статус товара "' || COALESCE(p_data->>'title', 'товар') || '" изменен на "' || COALESCE(p_data->>'status', 'неизвестно') || '"';
      message_en := 'Product "' || COALESCE(p_data->>'title', 'product') || '" status changed to "' || COALESCE(p_data->>'status', 'unknown') || '"';
      
    WHEN 'NEW_ORDER' THEN
      title_ru := 'Новый заказ';
      title_en := 'New Order';
      message_ru := 'Получен новый заказ #' || COALESCE(p_data->>'order_number', p_data->>'order_id', 'N/A');
      message_en := 'New order received #' || COALESCE(p_data->>'order_number', p_data->>'order_id', 'N/A');
      
    WHEN 'ORDER_CREATED' THEN
      title_ru := 'Заказ создан';
      title_en := 'Order Created';
      message_ru := 'Заказ #' || COALESCE(p_data->>'order_number', p_data->>'order_id', 'N/A') || ' успешно создан';
      message_en := 'Order #' || COALESCE(p_data->>'order_number', p_data->>'order_id', 'N/A') || ' successfully created';
      
    WHEN 'ORDER_STATUS_CHANGE' THEN
      title_ru := 'Изменение статуса заказа';
      title_en := 'Order Status Changed';
      message_ru := 'Статус заказа #' || COALESCE(p_data->>'order_number', p_data->>'order_id', 'N/A') || ' изменен на "' || COALESCE(p_data->>'status', 'неизвестно') || '"';
      message_en := 'Order #' || COALESCE(p_data->>'order_number', p_data->>'order_id', 'N/A') || ' status changed to "' || COALESCE(p_data->>'status', 'unknown') || '"';
      
    WHEN 'ORDER_CONFIRMATION' THEN
      title_ru := 'Подтверждение заказа';
      title_en := 'Order Confirmation';
      message_ru := 'Заказ #' || COALESCE(p_data->>'order_number', p_data->>'order_id', 'N/A') || ' подтвержден';
      message_en := 'Order #' || COALESCE(p_data->>'order_number', p_data->>'order_id', 'N/A') || ' confirmed';
      
    WHEN 'NEW_PRODUCT' THEN
      title_ru := 'Новый товар';
      title_en := 'New Product';
      message_ru := 'Добавлен новый товар: ' || COALESCE(p_data->>'title', 'новый товар');
      message_en := 'New product added: ' || COALESCE(p_data->>'title', 'new product');
      
    WHEN 'ADMIN_MESSAGE' THEN
      title_ru := 'Сообщение от администрации';
      title_en := 'Admin Message';
      message_ru := COALESCE(p_data->>'message', 'У вас есть новое сообщение от администрации');
      message_en := COALESCE(p_data->>'message_en', p_data->>'message', 'You have a new message from administration');
      
    WHEN 'PRICE_OFFER' THEN
      title_ru := 'Предложение цены';
      title_en := 'Price Offer';
      message_ru := 'Новое предложение цены: ' || COALESCE(p_data->>'offered_price', '0') || ' руб.';
      message_en := 'New price offer: $' || COALESCE(p_data->>'offered_price', '0');
      
    WHEN 'PRICE_OFFER_SUBMITTED' THEN
      title_ru := 'Предложение цены отправлено';
      title_en := 'Price Offer Submitted';
      message_ru := 'Ваше предложение цены ' || COALESCE(p_data->>'offered_price', '0') || ' руб. отправлено';
      message_en := 'Your price offer $' || COALESCE(p_data->>'offered_price', '0') || ' has been submitted';
      
    WHEN 'PRICE_OFFER_RESPONSE' THEN
      title_ru := 'Ответ на предложение цены';
      title_en := 'Price Offer Response';
      message_ru := 'Получен ответ на ваше предложение цены';
      message_en := 'Response received for your price offer';
      
    WHEN 'PRICE_OFFER_ACCEPTED' THEN
      title_ru := 'Предложение цены принято';
      title_en := 'Price Offer Accepted';
      message_ru := 'Ваше предложение цены ' || COALESCE(p_data->>'offered_price', '0') || ' руб. принято';
      message_en := 'Your price offer $' || COALESCE(p_data->>'offered_price', '0') || ' has been accepted';
      
    WHEN 'PROFILE_UPDATE' THEN
      title_ru := 'Обновление профиля';
      title_en := 'Profile Update';
      message_ru := 'Ваш профиль был обновлен';
      message_en := 'Your profile has been updated';
      
    WHEN 'SYSTEM_MESSAGE' THEN
      title_ru := 'Системное сообщение';
      title_en := 'System Message';
      message_ru := COALESCE(p_data->>'message', 'Системное уведомление');
      message_en := COALESCE(p_data->>'message_en', p_data->>'message', 'System notification');
      
    ELSE
      title_ru := 'Уведомление';
      title_en := 'Notification';
      message_ru := 'У вас новое уведомление';
      message_en := 'You have a new notification';
  END CASE;
  
  -- Return result with all translations
  result := jsonb_build_object(
    'title', title_ru,
    'message', message_ru,
    'title_en', title_en,
    'message_en', message_en,
    'language', language_val
  );
  
  RAISE LOG 'Translation result: %', result;
  
  RETURN result;
END;
$function$;