-- Update lot 8514 to active status since seller is now trusted
UPDATE public.products 
SET status = 'active' 
WHERE lot_number = 8514;