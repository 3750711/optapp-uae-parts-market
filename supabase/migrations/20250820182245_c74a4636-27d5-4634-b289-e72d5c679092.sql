-- Add category column to confirm_images table for 2-step wizard
ALTER TABLE public.confirm_images 
ADD COLUMN category text CHECK (category IN ('chat_screenshot','signed_product')) DEFAULT NULL;

-- Create index for better performance when filtering by order and category
CREATE INDEX IF NOT EXISTS confirm_images_order_category_idx 
ON public.confirm_images (order_id, category);