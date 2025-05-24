
-- Function to allow admins to safely delete stores with all related data
CREATE OR REPLACE FUNCTION public.admin_delete_store(
  p_store_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- This function will run with the privileges of the definer
AS $$
BEGIN
  -- Only proceed if user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can use this function';
  END IF;

  -- Delete all store car brands associations
  DELETE FROM public.store_car_brands
  WHERE store_id = p_store_id;
  
  -- Delete all store car models associations
  DELETE FROM public.store_car_models
  WHERE store_id = p_store_id;
  
  -- Delete all store reviews
  DELETE FROM public.store_reviews
  WHERE store_id = p_store_id;
  
  -- Delete all store images
  DELETE FROM public.store_images
  WHERE store_id = p_store_id;
  
  -- Finally delete the store
  DELETE FROM public.stores
  WHERE id = p_store_id;
  
  RETURN TRUE;
END;
$$;
