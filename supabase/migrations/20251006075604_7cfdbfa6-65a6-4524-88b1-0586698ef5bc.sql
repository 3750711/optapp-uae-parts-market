-- RPC function to resend product notification
-- Similar to resend_order_notification but for products
CREATE OR REPLACE FUNCTION public.resend_product_notification(p_product_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_response jsonb;
  v_product RECORD;
  v_function_url text;
BEGIN
  -- Check admin permissions
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can resend product notifications';
  END IF;

  -- Get product data
  SELECT * INTO v_product
  FROM products
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found: %', p_product_id;
  END IF;

  -- Get function URL using helper
  v_function_url := functions_url('/functions/v1/send-telegram-notification');

  -- Call Edge Function via HTTP
  SELECT content::jsonb INTO v_response
  FROM http((
    'POST',
    v_function_url,
    ARRAY[
      http_header('Content-Type', 'application/json')
    ],
    'application/json',
    jsonb_build_object(
      'productId', p_product_id,
      'notificationType', 'product_published'
    )::text
  )::http_request);

  -- Update last notification timestamp
  UPDATE products
  SET last_notification_sent_at = now()
  WHERE id = p_product_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Product notification sent successfully',
    'response', v_response
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in resend_product_notification: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;