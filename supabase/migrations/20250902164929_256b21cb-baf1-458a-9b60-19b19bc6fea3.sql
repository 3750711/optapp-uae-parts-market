-- Fix trigger functions that reference non-existent 'images' field in products table

-- Fix notify_on_product_status_changes function
CREATE OR REPLACE FUNCTION public.notify_on_product_status_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_images BOOLEAN;
  product_images_array JSONB;
BEGIN
  -- Only notify on status changes to 'active' or 'sold'
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('active', 'sold') THEN
    
    -- Check if product has images
    SELECT EXISTS(SELECT 1 FROM public.product_images WHERE product_id = NEW.id) INTO has_images;
    
    -- Get product images as JSON array
    SELECT COALESCE(
      jsonb_agg(url ORDER BY is_primary DESC NULLS LAST, created_at), 
      '[]'::jsonb
    ) INTO product_images_array
    FROM public.product_images 
    WHERE product_id = NEW.id;
    
    -- Only send notification for 'active' products if they have images
    IF NEW.status = 'active' AND NOT has_images THEN
      RETURN NEW;
    END IF;
    
    -- Send notification via Edge Function
    PERFORM
      net.http_post(
        url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/send-product-publish-notification',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
        body:=jsonb_build_object(
          'productId', NEW.id,
          'title', NEW.title,
          'price', NEW.price,
          'brand', NEW.brand,
          'model', NEW.model,
          'status', NEW.status,
          'sellerName', NEW.seller_name,
          'images', product_images_array,
          'telegramUrl', NEW.telegram_url,
          'productUrl', NEW.product_url,
          'lotNumber', NEW.lot_number
        )
      );
      
    -- Update last notification timestamp
    UPDATE public.products 
    SET last_notification_sent_at = NOW() 
    WHERE id = NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix notify_seller_product_sold function (if it exists)
CREATE OR REPLACE FUNCTION public.notify_seller_product_sold()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  product_images_array JSONB;
BEGIN
  -- Get product images as JSON array
  SELECT COALESCE(
    jsonb_agg(url ORDER BY is_primary DESC NULLS LAST, created_at), 
    '[]'::jsonb
  ) INTO product_images_array
  FROM public.product_images 
  WHERE product_id = NEW.product_id;

  -- Send notification via Edge Function
  PERFORM
    net.http_post(
      url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/send-product-sold-notification',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
      body:=jsonb_build_object(
        'productId', NEW.product_id,
        'images', product_images_array
      )
    );
    
  RETURN NEW;
END;
$$;

-- Fix notify_on_order_creation function (if it exists)
CREATE OR REPLACE FUNCTION public.notify_on_order_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  order_images_array JSONB;
BEGIN
  -- Get order images as JSON array
  SELECT COALESCE(
    jsonb_agg(url ORDER BY is_primary DESC NULLS LAST, created_at), 
    '[]'::jsonb
  ) INTO order_images_array
  FROM public.order_images 
  WHERE order_id = NEW.id;

  -- Send notification via Edge Function
  PERFORM
    net.http_post(
      url:='https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/notify-order-creation',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"}'::jsonb,
      body:=jsonb_build_object(
        'orderId', NEW.id,
        'images', order_images_array
      )
    );
    
  RETURN NEW;
END;
$$;