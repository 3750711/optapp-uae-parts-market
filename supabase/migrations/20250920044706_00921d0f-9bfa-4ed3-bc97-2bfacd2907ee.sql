-- Add new columns to free_order_upload_logs table for file size tracking
ALTER TABLE public.free_order_upload_logs 
ADD COLUMN original_size BIGINT,
ADD COLUMN compressed_size BIGINT,
ADD COLUMN compression_ratio NUMERIC(5,4);

-- Add comments for documentation
COMMENT ON COLUMN public.free_order_upload_logs.original_size IS 'Original file size in bytes';
COMMENT ON COLUMN public.free_order_upload_logs.compressed_size IS 'Compressed file size in bytes (same as original if no compression)';
COMMENT ON COLUMN public.free_order_upload_logs.compression_ratio IS 'Compression ratio (compressed_size / original_size)';