-- Update all database triggers to use custom domain api.partsbay.ae instead of direct Supabase URLs

-- Update notify_on_product_status_changes function
CREATE OR REPLACE FUNCTION public.notify_on_product_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Only send notifications for status changes to 'active' (if has images) or 'sold'
  IF NEW.status IS DISTINCT FROM OLD.status AND 
     (NEW.status = 'active' OR NEW.status = 'sold') AND
     (OLD.last_notification_sent_at IS NULL OR 
      OLD.last_notification_sent_at < (now() - interval '5 minutes')) THEN
    
    -- For 'active' status, only send if product has images
    IF NEW.status = 'active' AND (NEW.images IS NULL OR jsonb_array_length(NEW.images) = 0) THEN
      RETURN NEW;
    END IF;
    
    -- Send notification via Edge Function using custom domain
    PERFORM
      net.http_post(
        url:='https://api.partsbay.ae/functions/v1/send-telegram-notification',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
        body:=json_build_object(
          'product', json_build_object(
            'id', NEW.id,
            'title', NEW.title,
            'price', NEW.price,
            'status', NEW.status,
            'old_status', OLD.status,
            'seller_id', NEW.seller_id,
            'seller_name', NEW.seller_name,
            'brand', NEW.brand,
            'model', NEW.model,
            'images', NEW.images,
            'product_url', NEW.product_url,
            'telegram_url', NEW.telegram_url
          ),
          'action', 'status_change'
        )::jsonb
      );
      
    -- Update last notification timestamp
    NEW.last_notification_sent_at := now();
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update notify_seller_product_sold function
CREATE OR REPLACE FUNCTION public.notify_seller_product_sold()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Only send notification for newly created orders
  IF TG_OP = 'INSERT' THEN
    -- Call the notify-seller-product-sold edge function using custom domain
    PERFORM
      net.http_post(
        url:='https://api.partsbay.ae/functions/v1/notify-seller-product-sold',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
        body:=jsonb_build_object(
          'orderId', NEW.id,
          'sellerId', NEW.seller_id,
          'orderNumber', NEW.order_number,
          'buyerOptId', NEW.buyer_opt_id,
          'productId', NEW.product_id,
          'title', NEW.title,
          'price', NEW.price,
          'brand', NEW.brand,
          'model', NEW.model,
          'images', NEW.images
        )
      );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update notify_on_order_creation function
CREATE OR REPLACE FUNCTION public.notify_on_order_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Send notification to Telegram group only for new order creation
  IF TG_OP = 'INSERT' THEN
    -- Call Edge Function for sending notification to group using custom domain
    PERFORM
      net.http_post(
        url:='https://api.partsbay.ae/functions/v1/send-telegram-notification',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
        body:=json_build_object(
          'order', json_build_object(
            'id', NEW.id,
            'order_number', NEW.order_number,
            'title', NEW.title,
            'price', NEW.price,
            'status', NEW.status,
            'created_at', NEW.created_at,
            'buyer_id', NEW.buyer_id,
            'seller_id', NEW.seller_id,
            'buyer_opt_id', NEW.buyer_opt_id,
            'seller_opt_id', NEW.seller_opt_id,
            'order_seller_name', NEW.order_seller_name,
            'telegram_url_buyer', NEW.telegram_url_buyer,
            'telegram_url_order', NEW.telegram_url_order,
            'brand', NEW.brand,
            'model', NEW.model,
            'delivery_method', NEW.delivery_method,
            'place_number', NEW.place_number,
            'text_order', NEW.text_order,
            'delivery_price_confirm', NEW.delivery_price_confirm,
            'images', NEW.images,
            'video_url', NEW.video_url,
            'order_created_type', NEW.order_created_type
          ),
          'action', 'create'
        )::jsonb
      );
      
    RAISE LOG 'Order creation notification sent to Telegram group for order %', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in order creation notification trigger: %', SQLERRM;
    RETURN NEW; -- Don't fail the transaction
END;
$function$;

-- Update notify_user_verification_status_change function
CREATE OR REPLACE FUNCTION public.notify_user_verification_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Only notify when verification_status changes
  IF OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
    -- Call the edge function to send user notification using custom domain
    PERFORM
      net.http_post(
        url:='https://api.partsbay.ae/functions/v1/notify-user-verification-status',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
        body:=jsonb_build_object(
          'userId', NEW.id,
          'status', NEW.verification_status,
          'userType', NEW.user_type,
          'fullName', COALESCE(NEW.full_name, 'Пользователь'),
          'telegramId', NEW.telegram_id
        )
      );
      
    RAISE LOG 'User verification status notification sent for user %', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in user verification status notification trigger: %', SQLERRM;
    RETURN NEW; -- Don't fail the transaction
END;
$function$;

-- Update create_price_offer_status_notification function
CREATE OR REPLACE FUNCTION public.create_price_offer_status_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Only proceed for updates, not inserts
  IF TG_OP = 'UPDATE' THEN
    -- Handle status changes (existing logic)
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      -- Send status change notification
      PERFORM create_bilingual_notification(
        NEW.seller_id,
        'PRICE_OFFER_RESPONSE',
        jsonb_build_object(
          'offer_id', NEW.id,
          'product_id', NEW.product_id,
          'old_status', OLD.status,
          'status', NEW.status,
          'offered_price', NEW.offered_price,
          'original_price', NEW.original_price,
          'url', '/offers'
        )
      );

      -- Send Telegram notification for status changes using custom domain  
      BEGIN
        PERFORM
          net.http_post(
            url:='https://api.partsbay.ae/functions/v1/notify-seller-new-price-offer',
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
            body:=jsonb_build_object(
              'offerId', NEW.id,
              'productId', NEW.product_id,
              'sellerId', NEW.seller_id,
              'buyerId', NEW.buyer_id,
              'offeredPrice', NEW.offered_price,
              'originalPrice', NEW.original_price,
              'message', NEW.message,
              'expiresAt', NEW.expires_at,
              'notificationType', 'status_change'
            )
          );
      EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Failed to send telegram status change notification for offer %: %', NEW.id, SQLERRM;
      END;
    END IF;

    -- Handle price changes (new logic)
    IF OLD.offered_price IS DISTINCT FROM NEW.offered_price AND OLD.status = NEW.status THEN
      -- Send price change notification
      PERFORM create_bilingual_notification(
        NEW.seller_id,
        'PRICE_OFFER_RESPONSE',
        jsonb_build_object(
          'offer_id', NEW.id,
          'product_id', NEW.product_id,
          'old_price', OLD.offered_price,
          'offered_price', NEW.offered_price,
          'original_price', NEW.original_price,
          'url', '/offers'
        )
      );

      -- Send Telegram notification for price changes using custom domain
      BEGIN
        PERFORM
          net.http_post(
            url:='https://api.partsbay.ae/functions/v1/notify-seller-new-price-offer',
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
            body:=jsonb_build_object(
              'offerId', NEW.id,
              'productId', NEW.product_id,
              'sellerId', NEW.seller_id,
              'buyerId', NEW.buyer_id,
              'offeredPrice', NEW.offered_price,
              'oldPrice', OLD.offered_price,
              'originalPrice', NEW.original_price,
              'message', NEW.message,
              'expiresAt', NEW.expires_at,
              'notificationType', 'price_update'
            )
          );
      EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Failed to send telegram price change notification for offer %: %', NEW.id, SQLERRM;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;