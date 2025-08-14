-- Fix hybrid_search_products function conflicts
-- Drop all existing versions of the function
DROP FUNCTION IF EXISTS public.hybrid_search_products(vector, text, double precision, integer, integer);
DROP FUNCTION IF EXISTS public.hybrid_search_products(vector, text, real, integer, integer);

-- Ensure pg_trgm extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create the improved hybrid search function with consistent types
CREATE OR REPLACE FUNCTION public.hybrid_search_products(
  query_embedding vector(1536),
  search_keywords text,
  similarity_threshold double precision DEFAULT 0.2,
  match_count integer DEFAULT 100,
  query_length integer DEFAULT 1
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
  created_at timestamptz,
  similarity_score double precision,
  exact_match_score double precision,
  hybrid_score double precision
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
    p.price,
    p.seller_name,
    p.preview_image_url,
    p.status,
    p.created_at,
    -- Semantic similarity using embeddings
    (1 - (pe.embedding <=> query_embedding))::double precision as similarity_score,
    -- Text similarity using pg_trgm
    GREATEST(
      COALESCE(similarity(LOWER(p.title), LOWER(search_keywords)), 0),
      COALESCE(similarity(LOWER(p.brand), LOWER(search_keywords)), 0),
      COALESCE(similarity(LOWER(p.model), LOWER(search_keywords)), 0),
      COALESCE(similarity(LOWER(p.description), LOWER(search_keywords)), 0)
    )::double precision as exact_match_score,
    -- Hybrid score combining both
    (
      (1 - (pe.embedding <=> query_embedding)) * 0.7 +
      GREATEST(
        COALESCE(similarity(LOWER(p.title), LOWER(search_keywords)), 0),
        COALESCE(similarity(LOWER(p.brand), LOWER(search_keywords)), 0),
        COALESCE(similarity(LOWER(p.model), LOWER(search_keywords)), 0),
        COALESCE(similarity(LOWER(p.description), LOWER(search_keywords)), 0)
      ) * 0.3
    )::double precision as hybrid_score
  FROM products p
  INNER JOIN product_embeddings pe ON p.id = pe.product_id
  WHERE p.status IN ('active', 'sold')
    AND (1 - (pe.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY hybrid_score DESC, similarity_score DESC
  LIMIT match_count;
END;
$$;