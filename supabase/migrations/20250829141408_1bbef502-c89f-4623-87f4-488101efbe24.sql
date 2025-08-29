-- Fix security warning by adding proper search_path to get_next_order_number function
CREATE OR REPLACE FUNCTION public.get_next_order_number()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Check if the calling user has the right permissions
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type IN ('admin', 'seller', 'buyer')
  ) THEN
    RAISE EXCEPTION 'Access denied. Only authenticated users can get order numbers.';
  END IF;

  -- Get the next order number from sequence (atomic operation)
  next_number := nextval('orders_order_number_seq');
  
  -- Log the order number generation
  RAISE LOG 'Generated order number % for user %', next_number, auth.uid();
  
  RETURN next_number;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in get_next_order_number: %', SQLERRM;
    RAISE;
END;
$$;