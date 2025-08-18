-- Clean up existing orders with duplicated images
-- This will deduplicate images for all orders that have duplicate image entries

CREATE OR REPLACE FUNCTION deduplicate_order_images()
RETURNS TABLE (
  order_id UUID,
  order_number INTEGER,
  original_count INTEGER,
  deduplicated_count INTEGER,
  duplicates_removed INTEGER
) 
LANGUAGE plpgsql
AS $$
DECLARE
  order_record RECORD;
  unique_images TEXT[];
  original_count INTEGER;
  duplicate_count INTEGER;
BEGIN
  -- Iterate through all orders that have images
  FOR order_record IN 
    SELECT id, order_number, images 
    FROM orders 
    WHERE images IS NOT NULL AND array_length(images, 1) > 0
  LOOP
    -- Get original count
    original_count := array_length(order_record.images, 1);
    
    -- Create deduplicated array using array_agg with DISTINCT
    SELECT array_agg(DISTINCT img ORDER BY img)
    INTO unique_images
    FROM unnest(order_record.images) AS img
    WHERE img IS NOT NULL AND img != '';
    
    -- Calculate duplicates removed
    duplicate_count := original_count - coalesce(array_length(unique_images, 1), 0);
    
    -- Only update if there were duplicates
    IF duplicate_count > 0 THEN
      UPDATE orders 
      SET images = unique_images,
          updated_at = now()
      WHERE id = order_record.id;
      
      -- Return the result
      order_id := order_record.id;
      order_number := order_record.order_number;
      original_count := original_count;
      deduplicated_count := coalesce(array_length(unique_images, 1), 0);
      duplicates_removed := duplicate_count;
      
      RETURN NEXT;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$;

-- Run the deduplication function and show results
SELECT * FROM deduplicate_order_images();

-- Drop the function after use
DROP FUNCTION deduplicate_order_images();