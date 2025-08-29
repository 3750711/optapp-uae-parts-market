-- Fix get_next_order_number function - replace FOR UPDATE with table locking
CREATE OR REPLACE FUNCTION public.get_next_order_number()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  RAISE LOG 'get_next_order_number: Starting order number generation with table locking';
  
  -- Lock the entire orders table to prevent race conditions
  -- SHARE ROW EXCLUSIVE allows SELECT but blocks INSERT/UPDATE from other transactions
  LOCK TABLE public.orders IN SHARE ROW EXCLUSIVE MODE;
  
  -- Use MAX+1 logic to handle gaps and manual changes
  SELECT COALESCE(MAX(order_number), 0) + 1 
  INTO next_number 
  FROM public.orders;
  
  RAISE LOG 'get_next_order_number: Generated order number % with table locking', next_number;
  
  RETURN next_number;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in get_next_order_number: %', SQLERRM;
    RAISE;
END;
$$;