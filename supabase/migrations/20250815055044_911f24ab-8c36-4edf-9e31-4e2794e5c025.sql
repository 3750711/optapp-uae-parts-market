-- Drop existing function and recreate with improved ranking
DROP FUNCTION IF EXISTS public.semantic_search_products(vector, double precision, integer);

-- Create improved semantic search with smart ranking and boosting
CREATE OR REPLACE FUNCTION public.semantic_search_products(
  query_embedding vector(1536),
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
BEGIN
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
        CASE 
          -- High boost for very similar items (almost exact matches)
          WHEN (1 - (pe.embedding <=> query_embedding)) > 0.85 THEN 0.3
          ELSE 0.0
        END +
        CASE
          -- Medium boost for brand matches (fuzzy comparison)
          WHEN p.brand IS NOT NULL AND LENGTH(TRIM(p.brand)) > 0 THEN 0.2
          ELSE 0.0
        END +
        CASE
          -- Small boost for model matches (fuzzy comparison) 
          WHEN p.model IS NOT NULL AND LENGTH(TRIM(p.model)) > 0 THEN 0.1
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
      ORDER BY product_id, created_at DESC
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