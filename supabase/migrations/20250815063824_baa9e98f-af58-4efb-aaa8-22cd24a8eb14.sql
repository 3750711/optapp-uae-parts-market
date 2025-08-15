-- Drop the existing function and recreate with improved logic
DROP FUNCTION IF EXISTS public.semantic_search_products(vector, text, double precision, integer);

-- Create an optimized semantic search function that combines text search with embeddings
CREATE OR REPLACE FUNCTION public.semantic_search_products(
  query_embedding vector,
  search_query text,
  similarity_threshold float DEFAULT 0.15,
  match_count int DEFAULT 200
)
RETURNS TABLE (
  id uuid,
  title text,
  brand text,
  model text,
  price numeric,
  status product_status,
  seller_name text,
  seller_id uuid,
  created_at timestamp with time zone,
  preview_image_url text,
  similarity_score float,
  combined_score float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH semantic_matches AS (
    -- Get semantic matches from embeddings
    SELECT 
      pe.product_id,
      1 - (pe.embedding <=> query_embedding) as similarity
    FROM product_embeddings pe
    WHERE 1 - (pe.embedding <=> query_embedding) > similarity_threshold
    ORDER BY pe.embedding <=> query_embedding
    LIMIT match_count
  ),
  enriched_results AS (
    SELECT 
      p.id,
      p.title,
      p.brand,
      p.model,
      p.price,
      p.status,
      p.seller_name,
      p.seller_id,
      p.created_at,
      p.preview_image_url,
      sm.similarity as similarity_score,
      -- Calculate combined score with text matching bonuses
      sm.similarity + 
      CASE 
        -- Exact title match bonus
        WHEN LOWER(p.title) = LOWER(search_query) THEN 0.3
        -- Partial title match bonus
        WHEN LOWER(p.title) LIKE '%' || LOWER(search_query) || '%' THEN 0.2
        -- Brand exact match bonus
        WHEN LOWER(p.brand) = LOWER(search_query) THEN 0.25
        -- Model exact match bonus  
        WHEN LOWER(p.model) = LOWER(search_query) THEN 0.25
        -- Brand partial match bonus
        WHEN LOWER(p.brand) LIKE '%' || LOWER(search_query) || '%' THEN 0.15
        -- Model partial match bonus
        WHEN LOWER(p.model) LIKE '%' || LOWER(search_query) || '%' THEN 0.15
        ELSE 0
      END as combined_score
    FROM semantic_matches sm
    JOIN products p ON p.id = sm.product_id
    WHERE p.status IN ('active', 'sold')
  )
  SELECT 
    er.id,
    er.title,
    er.brand,
    er.model,
    er.price,
    er.status,
    er.seller_name,
    er.seller_id,
    er.created_at,
    er.preview_image_url,
    er.similarity_score,
    er.combined_score
  FROM enriched_results er
  ORDER BY er.combined_score DESC, er.similarity_score DESC
  LIMIT match_count;
END;
$$;