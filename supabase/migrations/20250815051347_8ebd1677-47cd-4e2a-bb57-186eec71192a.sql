-- Clean up all search functions and create simplified semantic search

-- Drop all existing functions
DROP FUNCTION IF EXISTS public.hybrid_search_products(vector, double precision, integer, text[]);
DROP FUNCTION IF EXISTS public.hybrid_search_products(vector, float, integer, text[]);
DROP FUNCTION IF EXISTS public.hybrid_search_products(vector, double precision, integer);
DROP FUNCTION IF EXISTS public.semantic_search_products(vector, double precision, integer);

-- Create simplified semantic_search_products function
CREATE OR REPLACE FUNCTION public.semantic_search_products(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.2,
  match_count int DEFAULT 100
)
RETURNS TABLE (
  id uuid,
  title text,
  brand text,
  model text,
  price double precision,
  seller_name text,
  preview_image_url text,
  status product_status,
  created_at timestamp with time zone,
  similarity_score float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.brand,
    p.model,
    p.price::double precision,
    p.seller_name,
    pi.url as preview_image_url,
    p.status,
    p.created_at,
    (1 - (pe.embedding <=> query_embedding))::float as similarity_score
  FROM products p
  LEFT JOIN product_embeddings pe ON p.id = pe.product_id
  LEFT JOIN (
    SELECT DISTINCT ON (product_id) 
      product_id, 
      url
    FROM product_images 
    WHERE is_primary = true
    ORDER BY product_id, product_images.created_at DESC
  ) pi ON p.id = pi.product_id
  WHERE pe.embedding IS NOT NULL
  AND (1 - (pe.embedding <=> query_embedding)) >= similarity_threshold
  AND p.status IN ('active', 'sold')
  ORDER BY similarity_score DESC
  LIMIT match_count;
END;
$$;