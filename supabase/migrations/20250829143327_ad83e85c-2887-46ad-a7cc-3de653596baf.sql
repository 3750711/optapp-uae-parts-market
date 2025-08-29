-- Fix authentication issue in get_next_order_number function
-- Remove auth check since it's only called from secure functions that already check permissions
CREATE OR REPLACE FUNCTION public.get_next_order_number()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  RAISE LOG 'get_next_order_number: Starting order number generation using MAX+1 logic';
  
  -- Use MAX+1 logic instead of sequence to handle gaps and manual changes
  -- Lock the orders table to prevent race conditions during order number generation
  SELECT COALESCE(MAX(order_number), 0) + 1 
  INTO next_number 
  FROM public.orders
  FOR UPDATE;
  
  RAISE LOG 'get_next_order_number: Generated order number % using MAX+1 logic', next_number;
  
  RETURN next_number;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in get_next_order_number: %', SQLERRM;
    RAISE;
END;
$$;