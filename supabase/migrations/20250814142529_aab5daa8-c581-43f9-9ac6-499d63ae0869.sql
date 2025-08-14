-- Drop the function with all possible signatures
DROP FUNCTION IF EXISTS public.hybrid_search_products(vector, text, double precision, integer, integer);
DROP FUNCTION IF EXISTS public.hybrid_search_products(vector, text, double precision, integer);

-- Create the correct hybrid_search_products function
CREATE OR REPLACE FUNCTION public.hybrid_search_products(
  query_embedding vector(1536),
  search_keywords text,
  similarity_threshold double precision DEFAULT 0.3,
  match_count integer DEFAULT 50,
  query_length integer DEFAULT 1
)
RETURNS TABLE (
  product_id uuid,
  title text,
  brand text,
  model text,
  price numeric,
  status product_status,
  created_at timestamp with time zone,
  seller_id uuid,
  seller_name text,
  similarity double precision,
  exact_match_score double precision,
  hybrid_score double precision,
  lot_number integer
)
LANGUAGE plpgsql
AS $$
DECLARE
  exact_weight double precision;
  similarity_weight double precision;
BEGIN
  -- Adjust weights based on query length
  IF query_length <= 2 THEN
    exact_weight := 0.7::double precision;        -- 70% for short queries
    similarity_weight := 0.3::double precision;   -- 30% for short queries
  ELSE
    exact_weight := 0.5::double precision;        -- 50% for longer queries  
    similarity_weight := 0.5::double precision;   -- 50% for longer queries
  END IF;

  RETURN QUERY
  SELECT
    p.id as product_id,
    p.title,
    p.brand,
    p.model,
    p.price,
    p.status,
    p.created_at,
    p.seller_id,
    p.seller_name,
    (1::double precision - (pe.embedding <=> query_embedding)) as similarity,
    
    -- Exact match scoring with explicit double precision casting
    (CASE 
      WHEN search_keywords = '' THEN 0.0::double precision
      WHEN LOWER(p.title || ' ' || p.brand || ' ' || p.model) LIKE '%' || LOWER(search_keywords) || '%' THEN 1.0::double precision
      WHEN LOWER(p.brand || ' ' || p.model) LIKE '%' || LOWER(search_keywords) || '%' THEN 0.8::double precision
      WHEN LOWER(p.title) LIKE '%' || LOWER(search_keywords) || '%' THEN 0.6::double precision
      ELSE 0.0::double precision
    END) as exact_match_score,
    
    -- Hybrid score calculation with explicit double precision casting
    (exact_weight * (CASE 
      WHEN search_keywords = '' THEN 0.0::double precision
      WHEN LOWER(p.title || ' ' || p.brand || ' ' || p.model) LIKE '%' || LOWER(search_keywords) || '%' THEN 1.0::double precision
      WHEN LOWER(p.brand || ' ' || p.model) LIKE '%' || LOWER(search_keywords) || '%' THEN 0.8::double precision
      WHEN LOWER(p.title) LIKE '%' || LOWER(search_keywords) || '%' THEN 0.6::double precision
      ELSE 0.0::double precision
    END) + similarity_weight * (1::double precision - (pe.embedding <=> query_embedding))) as hybrid_score,
    
    p.lot_number
  FROM 
    public.products p
  INNER JOIN 
    public.product_embeddings pe ON p.id = pe.product_id
  WHERE 
    pe.embedding IS NOT NULL
    AND (1::double precision - (pe.embedding <=> query_embedding)) > similarity_threshold
    AND p.status IN ('active', 'sold')
  ORDER BY
    -- Active products first
    CASE WHEN p.status = 'active' THEN 0 ELSE 1 END,
    -- Then by hybrid score (descending)
    (exact_weight * (CASE 
      WHEN search_keywords = '' THEN 0.0::double precision
      WHEN LOWER(p.title || ' ' || p.brand || ' ' || p.model) LIKE '%' || LOWER(search_keywords) || '%' THEN 1.0::double precision
      WHEN LOWER(p.brand || ' ' || p.model) LIKE '%' || LOWER(search_keywords) || '%' THEN 0.8::double precision
      WHEN LOWER(p.title) LIKE '%' || LOWER(search_keywords) || '%' THEN 0.6::double precision
      ELSE 0.0::double precision
    END) + similarity_weight * (1::double precision - (pe.embedding <=> query_embedding))) DESC,
    -- Finally by creation date (newest first)
    p.created_at DESC
  LIMIT match_count;
END;
$$;