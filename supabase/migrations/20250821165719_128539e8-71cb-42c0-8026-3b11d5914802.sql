-- Clean up duplicate images in existing orders
UPDATE orders 
SET images = (
  SELECT array_agg(DISTINCT unnested_image ORDER BY unnested_image)
  FROM unnest(images) AS unnested_image
)
WHERE array_length(images, 1) != (
  SELECT array_length(array_agg(DISTINCT unnested_image), 1)
  FROM unnest(images) AS unnested_image
);