-- Create trigger to enforce 50 photo limit in orders table
CREATE OR REPLACE FUNCTION public.enforce_order_images_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if images array has more than 50 elements
  IF array_length(NEW.images, 1) > 50 THEN
    RAISE EXCEPTION 'Photo limit exceeded: Maximum 50 photos allowed per order, but % photos were provided', array_length(NEW.images, 1)
      USING ERRCODE = 'check_violation',
            HINT = 'Please reduce the number of photos to 50 or fewer';
  END IF;
  
  -- Log the attempt if limit is exceeded (this won't execute due to exception above, but kept for reference)
  IF array_length(NEW.images, 1) > 50 THEN
    INSERT INTO public.event_logs (
      action_type, 
      entity_type, 
      entity_id, 
      user_id,
      details
    ) VALUES (
      'photo_limit_breach', 
      'order', 
      NEW.id, 
      auth.uid(),
      jsonb_build_object(
        'photo_count', array_length(NEW.images, 1),
        'limit', 50,
        'order_number', NEW.order_number
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for INSERT operations
DROP TRIGGER IF EXISTS trigger_enforce_order_images_limit_insert ON public.orders;
CREATE TRIGGER trigger_enforce_order_images_limit_insert
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_order_images_limit();

-- Create trigger for UPDATE operations  
DROP TRIGGER IF EXISTS trigger_enforce_order_images_limit_update ON public.orders;
CREATE TRIGGER trigger_enforce_order_images_limit_update
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_order_images_limit();

-- Add helper function to count total photos for an order (from both images array and order_media table)
CREATE OR REPLACE FUNCTION public.count_order_photos(p_order_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  images_count INTEGER := 0;
  media_count INTEGER := 0;
  total_count INTEGER := 0;
BEGIN
  -- Count photos from images array
  SELECT COALESCE(array_length(images, 1), 0) 
  INTO images_count
  FROM public.orders 
  WHERE id = p_order_id;
  
  -- Count photos from order_media table
  SELECT COUNT(*)
  INTO media_count
  FROM public.order_media 
  WHERE order_id = p_order_id 
  AND file_type = 'photo';
  
  total_count := COALESCE(images_count, 0) + COALESCE(media_count, 0);
  
  RETURN total_count;
END;
$$;