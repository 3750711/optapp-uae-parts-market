-- Add foreign key constraint between free_order_upload_logs and profiles
-- This will establish the missing relationship that caused the schema cache error

ALTER TABLE public.free_order_upload_logs 
ADD CONSTRAINT fk_free_order_upload_logs_user_id 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_free_order_upload_logs_user_id 
ON public.free_order_upload_logs(user_id);