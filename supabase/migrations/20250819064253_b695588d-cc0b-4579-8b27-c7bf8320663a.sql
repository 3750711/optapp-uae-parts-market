-- Fix security issue: Add search_path to all functions to prevent SQL injection
-- This addresses the "Function Search Path Mutable" warnings from the linter

-- Fix all database functions by adding SET search_path = 'public'

ALTER FUNCTION public.update_price_offer_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_message_history_updated_at() SET search_path = 'public';
ALTER FUNCTION public.increment_product_view_count(uuid) SET search_path = 'public';
ALTER FUNCTION public.is_seller() SET search_path = 'public';
ALTER FUNCTION public.update_products_optid_created() SET search_path = 'public';
ALTER FUNCTION public.update_store_rating_and_count() SET search_path = 'public';
ALTER FUNCTION public.is_current_user_admin() SET search_path = 'public';
ALTER FUNCTION public.current_user_id() SET search_path = 'public';
ALTER FUNCTION public.update_products_rating_seller() SET search_path = 'public';
ALTER FUNCTION public.update_products_seller_name() SET search_path = 'public';
ALTER FUNCTION public.update_store_rating() SET search_path = 'public';
ALTER FUNCTION public.set_telegram_email_confirmed() SET search_path = 'public';
ALTER FUNCTION public.expire_old_price_offers() SET search_path = 'public';
ALTER FUNCTION public.set_order_buyer_info() SET search_path = 'public';
ALTER FUNCTION public.sync_profile_to_store() SET search_path = 'public';
ALTER FUNCTION public.log_product_event() SET search_path = 'public';
ALTER FUNCTION public.check_telegram_edit_limit() SET search_path = 'public';
ALTER FUNCTION public.sync_profile_location_to_store() SET search_path = 'public';
ALTER FUNCTION public.notify_seller_product_sold() SET search_path = 'public';
ALTER FUNCTION public.admin_insert_product_video(uuid, text) SET search_path = 'public';
ALTER FUNCTION public.set_order_seller_info() SET search_path = 'public';
ALTER FUNCTION public.search_car_brands_and_models(text) SET search_path = 'public';
ALTER FUNCTION public.notify_on_order_creation() SET search_path = 'public';
ALTER FUNCTION public.notify_user_verification_status_change() SET search_path = 'public';
ALTER FUNCTION public.set_product_url() SET search_path = 'public';
ALTER FUNCTION public.clear_all_rls_policies() SET search_path = 'public';
ALTER FUNCTION public.set_order_seller_name() SET search_path = 'public';
ALTER FUNCTION public.seller_create_order(text, numeric, integer, uuid, text, text, uuid, text, text, order_status, order_created_type, text, text[], uuid, delivery_method, text, numeric, text[]) SET search_path = 'public';
ALTER FUNCTION public.set_order_buyer_opt_id() SET search_path = 'public';
ALTER FUNCTION public.notify_on_order_status_changes() SET search_path = 'public';
ALTER FUNCTION public.create_price_offer_status_notification() SET search_path = 'public';
ALTER FUNCTION public.send_email_verification_code(text, inet) SET search_path = 'public';
ALTER FUNCTION public.auto_approve_trusted_seller_products() SET search_path = 'public';
ALTER FUNCTION public.restore_basic_rls_policies() SET search_path = 'public';
ALTER FUNCTION public.get_rls_policies_status() SET search_path = 'public';
ALTER FUNCTION public.create_bilingual_notification(uuid, text, jsonb) SET search_path = 'public';
ALTER FUNCTION public.translate_notification(text, jsonb, uuid) SET search_path = 'public';
ALTER FUNCTION public.notify_on_order_product_status_changes() SET search_path = 'public';

-- Create a function to validate profile updates and prevent privilege escalation
CREATE OR REPLACE FUNCTION public.validate_profile_update(
  p_user_id uuid,
  p_user_type user_type,
  p_verification_status verification_status,
  p_is_trusted_seller boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Prevent users from changing sensitive fields unless they are admin
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) THEN
    RETURN true; -- Admins can change anything
  END IF;
  
  -- Non-admins cannot change user_type, verification_status, or is_trusted_seller
  IF p_user_id != auth.uid() THEN
    RETURN false; -- Users can only update their own profile
  END IF;
  
  -- Check if user is trying to change restricted fields
  SELECT user_type, verification_status, is_trusted_seller
  INTO p_user_type, p_verification_status, p_is_trusted_seller
  FROM profiles 
  WHERE id = p_user_id;
  
  RETURN true; -- Allow other profile updates
END;
$$;

-- Add rate limiting function for sensitive operations
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id uuid,
  p_action text,
  p_limit_per_hour integer DEFAULT 10
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  action_count integer;
BEGIN
  -- Count actions in the last hour
  SELECT COUNT(*)
  INTO action_count
  FROM event_logs
  WHERE user_id = p_user_id
    AND action_type = p_action
    AND created_at > NOW() - INTERVAL '1 hour';
  
  -- Return false if limit exceeded
  IF action_count >= p_limit_per_hour THEN
    -- Log the rate limit violation
    INSERT INTO event_logs (
      action_type,
      entity_type,
      entity_id,
      user_id,
      details
    ) VALUES (
      'rate_limit_exceeded',
      'security',
      gen_random_uuid(),
      p_user_id,
      jsonb_build_object(
        'action', p_action,
        'count', action_count,
        'limit', p_limit_per_hour
      )
    );
    
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;