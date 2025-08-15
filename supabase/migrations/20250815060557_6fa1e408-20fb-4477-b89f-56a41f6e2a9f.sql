-- Fix semantic search ranking to properly match keywords from query
DROP FUNCTION IF EXISTS public.semantic_search_products(vector, double precision, integer);

-- Create improved semantic search with proper query-based matching
CREATE OR REPLACE FUNCTION public.semantic_search_products(
  query_embedding vector(1536),
  search_query text,
  similarity_threshold float DEFAULT 0.4,
  match_count int DEFAULT 20
)
RETURNS TABLE (
  id uuid,
  title text,
  brand text,
  model text,
  price numeric,
  seller_name text,
  preview_image_url text,
  status product_status,
  created_at timestamp with time zone,
  similarity_score float,
  combined_score float
)
LANGUAGE plpgsql
AS $$
DECLARE
  query_words text[];
  word text;
BEGIN
  -- Split search query into words (lowercased for matching)
  query_words := string_to_array(lower(trim(search_query)), ' ');
  
  RETURN QUERY
  WITH ranked_products AS (
    SELECT
      p.id,
      p.title,
      p.brand,
      p.model,
      p.price,
      p.seller_name,
      pi.url AS preview_image_url,
      p.status,
      p.created_at,
      (1 - (pe.embedding <=> query_embedding))::float as similarity_score,
      (
        (1 - (pe.embedding <=> query_embedding))::float +
        -- Brand match bonus (+0.2): only if brand name appears in search query
        CASE 
          WHEN p.brand IS NOT NULL 
            AND EXISTS (
              SELECT 1 FROM unnest(query_words) AS qw 
              WHERE lower(p.brand) ILIKE '%' || qw || '%'
            )
          THEN 0.2
          ELSE 0.0
        END +
        -- Model match bonus (+0.3): only if model name appears in search query  
        CASE
          WHEN p.model IS NOT NULL 
            AND EXISTS (
              SELECT 1 FROM unnest(query_words) AS qw 
              WHERE lower(p.model) ILIKE '%' || qw || '%'
            )
          THEN 0.3
          ELSE 0.0
        END +
        -- Title keyword match bonus (+0.15): if any query word appears in title
        CASE
          WHEN p.title IS NOT NULL 
            AND EXISTS (
              SELECT 1 FROM unnest(query_words) AS qw 
              WHERE lower(p.title) ILIKE '%' || qw || '%'
            )
          THEN 0.15
          ELSE 0.0
        END
      )::float as combined_score
    FROM products p
    JOIN product_embeddings pe ON p.id = pe.product_id
    LEFT JOIN (
      SELECT DISTINCT ON (product_id) 
        product_id, 
        url
      FROM product_images 
      WHERE is_primary = true
      ORDER BY product_id, product_images.created_at DESC
    ) pi ON p.id = pi.product_id
    WHERE 
      pe.embedding IS NOT NULL
      AND (1 - (pe.embedding <=> query_embedding)) >= similarity_threshold
      AND p.status IN ('active', 'sold')
  )
  SELECT 
    rp.id,
    rp.title,
    rp.brand,
    rp.model,
    rp.price,
    rp.seller_name,
    rp.preview_image_url,
    rp.status,
    rp.created_at,
    rp.similarity_score,
    rp.combined_score
  FROM ranked_products rp
  ORDER BY 
    rp.combined_score DESC, 
    rp.similarity_score DESC, 
    rp.created_at DESC
  LIMIT match_count;
END;
$$;