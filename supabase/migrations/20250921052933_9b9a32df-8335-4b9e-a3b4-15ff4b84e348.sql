-- Drop existing view and recreate with catalog_position
DROP VIEW IF EXISTS products_with_view_estimate CASCADE;

-- Recreate the view including catalog_position column
CREATE VIEW products_with_view_estimate AS
SELECT 
  p.*,
  p.catalog_position,
  CASE 
    WHEN p.tg_notify_status = 'success' THEN 
      GREATEST(1, LEAST(100, ROUND(p.view_count * 1.2)))
    ELSE 
      0
  END as tg_views_estimate
FROM products p;