-- Миграция для исправления всех функций с жесткими URL на functions_url()
-- Сначала удаляем функции с конфликтующими параметрами, затем создаем обновленные

-- 1. Удаление и пересоздание admin_resend_welcome
DROP FUNCTION IF EXISTS public.admin_resend_welcome(uuid);

CREATE OR REPLACE FUNCTION public.admin_resend_welcome(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  current_user_type TEXT;
  user_data RECORD;
BEGIN
  -- Check if the calling user is an admin
  SELECT user_type INTO current_user_type
  FROM public.profiles
  WHERE id = auth.uid();
  
  IF current_user_type != 'admin' THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Only administrators can use this function'
    );
  END IF;
  
  -- Get user data
  SELECT * INTO user_data
  FROM public.profiles
  WHERE id = p_user_id;
  
  IF user_data IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'User not found'
    );
  END IF;
  
  -- Send welcome message using functions_url()
  BEGIN
    PERFORM
      net.http_post(
        url := public.functions_url('send-welcome-message'),
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := jsonb_build_object(
          'userId', user_data.id,
          'userType', user_data.user_type,
          'fullName', user_data.full_name,
          'email', user_data.email,
          'telegram', user_data.telegram,
          'isResend', true
        )
      );
    
    RETURN json_build_object(
      'success', true,
      'message', 'Welcome message resent successfully'
    );
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Error sending welcome message: %', SQLERRM;
      RETURN json_build_object(
        'success', false,
        'message', 'Failed to send welcome message'
      );
  END;
END;
$$;

-- 2. Обновление create_price_offer_notification
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

-- 3. Обновление notify_admins_new_pending_user
CREATE OR REPLACE FUNCTION public.notify_admins_new_pending_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only notify for new users with pending verification
  IF TG_OP = 'INSERT' AND NEW.verification_status = 'pending' THEN
    -- Send admin notification using functions_url()
    BEGIN
      PERFORM
        net.http_post(
          url := public.functions_url('notify-admins-new-user'),
          headers := '{"Content-Type": "application/json"}'::jsonb,
          body := jsonb_build_object(
            'userId', NEW.id,
            'fullName', NEW.full_name,
            'email', NEW.email,
            'userType', NEW.user_type,
            'telegram', NEW.telegram,
            'companyName', NEW.company_name,
            'phone', NEW.phone
          )
        );
      RAISE LOG 'Admin notification sent for new pending user: %', NEW.id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Error sending admin notification for user %: %', NEW.id, SQLERRM;
    END;
    
    -- Send welcome message using functions_url()
    BEGIN
      PERFORM
        net.http_post(
          url := public.functions_url('send-welcome-message'),
          headers := '{"Content-Type": "application/json"}'::jsonb,
          body := jsonb_build_object(
            'userId', NEW.id,
            'userType', NEW.user_type,
            'fullName', NEW.full_name,
            'email', NEW.email,
            'telegram', NEW.telegram
          )
        );
      RAISE LOG 'Welcome message sent for new user: %', NEW.id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Error sending welcome message for user %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Обновление create_price_offer_status_notification
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

-- 5. Обновление notify_on_seller_confirmation
CREATE OR REPLACE FUNCTION public.notify_on_seller_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Notify when order status changes to seller_confirmed
  IF TG_OP = 'UPDATE' AND OLD.status != 'seller_confirmed' AND NEW.status = 'seller_confirmed' THEN
    BEGIN
      PERFORM
        net.http_post(
          url := public.functions_url('send-telegram-notification'),
          headers := '{"Content-Type": "application/json"}'::jsonb,
          body := jsonb_build_object(
            'order', row_to_json(NEW),
            'action', 'seller_confirmed'
          )
        );
      RAISE LOG 'Seller confirmation notification sent for order %', NEW.id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Error sending seller confirmation notification for order %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 6. Обновление notify_user_verification_status_change
CREATE OR REPLACE FUNCTION public.notify_user_verification_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only notify on verification status changes
  IF TG_OP = 'UPDATE' AND OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
    BEGIN
      PERFORM
        net.http_post(
          url := public.functions_url('notify-user-verification-status'),
          headers := '{"Content-Type": "application/json"}'::jsonb,
          body := jsonb_build_object(
            'userId', NEW.id,
            'fullName', NEW.full_name,
            'email', NEW.email,
            'telegram', NEW.telegram,
            'oldStatus', OLD.verification_status,
            'newStatus', NEW.verification_status,
            'userType', NEW.user_type
          )
        );
      RAISE LOG 'Verification status notification sent for user %', NEW.id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Error sending verification status notification for user %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;