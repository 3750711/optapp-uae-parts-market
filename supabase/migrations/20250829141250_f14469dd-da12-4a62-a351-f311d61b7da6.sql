-- Sync orders_order_number_seq with current MAX(order_number) + 1
SELECT setval('orders_order_number_seq', COALESCE((SELECT MAX(order_number) FROM public.orders), 0) + 1);

-- Replace get_next_order_number() function to use sequence instead of MAX ... FOR UPDATE
CREATE OR REPLACE FUNCTION public.get_next_order_number()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
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