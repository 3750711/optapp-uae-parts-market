
-- Create or replace the function to handle copying orders and then delete the intermediate record
CREATE OR REPLACE FUNCTION public.copy_intermediate_order_to_orders()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  new_order_id UUID;
BEGIN
  INSERT INTO public.orders (
    title,
    brand,
    model,
    buyer_id,
    seller_id,
    price,
    quantity,
    buyer_opt_id,
    status,
    seller_name_order
  )
  SELECT 
    io.title,
    io.brand,
    io.model,
    io.buyer_id,
    p.id as seller_id,
    io.price,
    io.quantity,
    io.buyer_opt_id,
    'pending'::order_status,
    p.full_name as seller_name_order
  FROM public.intermediate_orders io
  JOIN public.profiles p ON p.opt_id = io.seller_opt_id
  WHERE io.id = NEW.id
  RETURNING id INTO new_order_id;
  
  -- If successfully inserted into orders table, delete from intermediate_orders
  IF new_order_id IS NOT NULL THEN
    DELETE FROM public.intermediate_orders WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;
