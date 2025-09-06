-- Fix notify_on_order_creation function
CREATE OR REPLACE FUNCTION public.notify_on_order_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Create bilingual notifications for both buyer and seller
  PERFORM create_bilingual_notification(
    NEW.buyer_id,
    'ORDER_CREATED',
    jsonb_build_object(
      'order_id', NEW.id,
      'order_number', NEW.order_number,
      'price', NEW.price,
      'title', NEW.title,
      'url', '/orders/' || NEW.id
    )
  );
  
  PERFORM create_bilingual_notification(
    NEW.seller_id,
    'NEW_ORDER',
    jsonb_build_object(
      'order_id', NEW.id,
      'order_number', NEW.order_number,
      'price', NEW.price,
      'title', NEW.title,
      'url', '/orders/' || NEW.id
    )
  );
  
  -- Send Telegram notification
  BEGIN
    PERFORM
      net.http_post(
        url := public.functions_url('send-telegram-notification'),
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := jsonb_build_object(
          'orderId', NEW.id,
          'notificationType', 'new_order'
        )
      );
    RAISE LOG 'Telegram notification sent for new order %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Error sending Telegram notification for new order %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$function$;

-- Fix notify_admins_new_pending_user function  
CREATE OR REPLACE FUNCTION public.notify_admins_new_pending_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Send notification via Edge Function
  BEGIN
    PERFORM
      net.http_post(
        url := public.functions_url('notify-admins-new-user'),
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := jsonb_build_object(
          'userId', p_user_id,
          'notificationType', 'new_user_pending'
        )
      );
    RAISE LOG 'Admin notification sent for new pending user %', p_user_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Error sending admin notification for new pending user %: %', p_user_id, SQLERRM;
  END;
END;
$function$;

-- Fix notify_user_verification_status_change function
CREATE OR REPLACE FUNCTION public.notify_user_verification_status_change(p_user_id uuid, p_old_status verification_status, p_new_status verification_status)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Send notification via Edge Function
  BEGIN
    PERFORM
      net.http_post(
        url := public.functions_url('notify-user-verification-status'),
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := jsonb_build_object(
          'userId', p_user_id,
          'oldStatus', p_old_status,
          'newStatus', p_new_status
        )
      );
    RAISE LOG 'Verification status notification sent for user %', p_user_id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Error sending verification status notification for user %: %', p_user_id, SQLERRM;
  END;
END;
$function$;