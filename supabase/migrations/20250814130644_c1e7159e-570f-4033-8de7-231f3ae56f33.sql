-- Fix hybrid search function to use separate product_embeddings table
CREATE OR REPLACE FUNCTION public.hybrid_search_products(
  query_embedding vector(1536),
  search_keywords text,
  similarity_threshold float DEFAULT 0.2,
  match_count int DEFAULT 50
)
RETURNS TABLE(
  product_id uuid,
  similarity float,
  exact_match_score float,
  hybrid_score float,
  title text,
  price numeric,
  brand text,
  model text
)
LANGUAGE plpgsql
AS $$
DECLARE
  keyword_array text[];
  keyword text;
  match_count_for_product int;
BEGIN
  -- Split search keywords into array and normalize
  keyword_array := string_to_array(lower(trim(search_keywords)), ' ');
  
  RETURN QUERY
  WITH semantic_results AS (
    SELECT 
      p.id as product_id,
      (1 - (pe.embedding <=> query_embedding)) as similarity,
      p.title,
      p.price,
      p.brand,
      p.model
    FROM public.products p
    JOIN public.product_embeddings pe ON p.id = pe.product_id
    WHERE pe.embedding IS NOT NULL
      AND p.status IN ('active', 'sold')
      AND (1 - (pe.embedding <=> query_embedding)) > similarity_threshold
  ),
  keyword_matches AS (
    SELECT 
      sr.product_id,
      sr.similarity,
      sr.title,
      sr.price,
      sr.brand,
      sr.model,
      -- Calculate exact match score based on keyword presence
      (
        SELECT COUNT(*)::float 
        FROM unnest(keyword_array) AS kw
        WHERE lower(sr.title) LIKE '%' || kw || '%'
          OR lower(COALESCE(sr.brand, '')) LIKE '%' || kw || '%'
          OR lower(COALESCE(sr.model, '')) LIKE '%' || kw || '%'
      ) / GREATEST(array_length(keyword_array, 1), 1) as exact_match_score
    FROM semantic_results sr
  )
  SELECT 
    km.product_id,
    km.similarity,
    km.exact_match_score,
    -- Hybrid score: 50% semantic similarity + 50% exact match
    (km.similarity * 0.5 + km.exact_match_score * 0.5) as hybrid_score,
    km.title,
    km.price,
    km.brand,
    km.model
  FROM keyword_matches km
  ORDER BY 
    -- First by exact match score (descending), then by hybrid score (descending)
    km.exact_match_score DESC,
    (km.similarity * 0.5 + km.exact_match_score * 0.5) DESC,
    -- Break ties with title length (shorter, more specific titles first)
    length(km.title) ASC
  LIMIT match_count;
END;
$$;