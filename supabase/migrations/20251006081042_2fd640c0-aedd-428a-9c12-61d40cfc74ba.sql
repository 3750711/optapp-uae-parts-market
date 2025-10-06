-- Simplify resend_product_notification RPC - remove HTTP call
-- Only update database, Edge Function will be called from TypeScript
CREATE OR REPLACE FUNCTION public.resend_product_notification(p_product_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product RECORD;
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

  -- Update last notification timestamp
  UPDATE products
  SET last_notification_sent_at = now()
  WHERE id = p_product_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Product notification timestamp updated'
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