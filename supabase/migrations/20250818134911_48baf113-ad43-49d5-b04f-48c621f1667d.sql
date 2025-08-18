-- Clean up existing orders with duplicated images  
-- Remove the updated_at field since it doesn't exist in orders table

UPDATE orders 
SET images = (
  SELECT array_agg(DISTINCT img ORDER BY img) 
  FROM unnest(images) AS img 
  WHERE img IS NOT NULL AND img != ''
)
WHERE images IS NOT NULL 
  AND array_length(images, 1) > 0
  AND array_length(images, 1) != array_length((
    SELECT array_agg(DISTINCT img ORDER BY img) 
    FROM unnest(images) AS img 
    WHERE img IS NOT NULL AND img != ''
  ), 1);

-- Show results of deduplication for order #8049
SELECT 
  order_number,
  array_length(images, 1) as image_count,
  images
FROM orders 
WHERE order_number = 8049;