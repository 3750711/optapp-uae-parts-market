-- Update hybrid search function to support more results by default
CREATE OR REPLACE FUNCTION public.hybrid_search_products(
  query_embedding vector(1536),
  search_keywords text,
  similarity_threshold float DEFAULT 0.2,
  match_count int DEFAULT 100
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
  adaptive_threshold float;
  keyword_count int;
BEGIN
  -- Split search keywords into array and normalize
  keyword_array := string_to_array(lower(trim(search_keywords)), ' ');
  keyword_count := array_length(keyword_array, 1);
  
  -- Use adaptive threshold: lower for short queries
  IF keyword_count <= 2 THEN
    adaptive_threshold := 0.1;  -- Lower threshold for short queries
  ELSE
    adaptive_threshold := similarity_threshold;
  END IF;
  
  RETURN QUERY
  WITH 
  -- Vector similarity search with adaptive threshold
  semantic_results AS (
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
      AND (1 - (pe.embedding <=> query_embedding)) > adaptive_threshold
  ),
  
  -- Parallel exact keyword search (independent of vector results)
  exact_keyword_results AS (
    SELECT 
      p.id as product_id,
      0.0 as similarity, -- Will be updated if found in semantic results
      p.title,
      p.price,
      p.brand,
      p.model
    FROM public.products p
    WHERE p.status IN ('active', 'sold')
      AND EXISTS (
        SELECT 1 FROM unnest(keyword_array) AS kw
        WHERE lower(p.title) LIKE '%' || kw || '%'
          OR lower(COALESCE(p.brand, '')) LIKE '%' || kw || '%'
          OR lower(COALESCE(p.model, '')) LIKE '%' || kw || '%'
      )
  ),
  
  -- Combine and deduplicate results
  combined_results AS (
    SELECT DISTINCT
      COALESCE(sr.product_id, ekr.product_id) as product_id,
      COALESCE(sr.similarity, 0.0) as similarity,
      COALESCE(sr.title, ekr.title) as title,
      COALESCE(sr.price, ekr.price) as price,
      COALESCE(sr.brand, ekr.brand) as brand,
      COALESCE(sr.model, ekr.model) as model
    FROM semantic_results sr
    FULL OUTER JOIN exact_keyword_results ekr ON sr.product_id = ekr.product_id
  ),
  
  -- Calculate exact match scores for all results
  scored_results AS (
    SELECT 
      cr.product_id,
      cr.similarity,
      cr.title,
      cr.price,
      cr.brand,
      cr.model,
      -- Calculate exact match score based on keyword presence
      (
        SELECT COUNT(*)::float 
        FROM unnest(keyword_array) AS kw
        WHERE lower(cr.title) LIKE '%' || kw || '%'
          OR lower(COALESCE(cr.brand, '')) LIKE '%' || kw || '%'
          OR lower(COALESCE(cr.model, '')) LIKE '%' || kw || '%'
      ) / GREATEST(keyword_count, 1) as exact_match_score
    FROM combined_results cr
  )
  
  SELECT 
    sr.product_id,
    sr.similarity,
    sr.exact_match_score,
    -- Adaptive hybrid scoring: prioritize exact matches for short queries
    CASE 
      WHEN keyword_count <= 2 THEN
        -- For short queries: 70% exact match + 30% semantic
        (sr.exact_match_score * 0.7 + sr.similarity * 0.3)
      ELSE
        -- For longer queries: 50% exact match + 50% semantic  
        (sr.exact_match_score * 0.5 + sr.similarity * 0.5)
    END as hybrid_score,
    sr.title,
    sr.price,
    sr.brand,
    sr.model
  FROM scored_results sr
  WHERE sr.exact_match_score > 0 OR sr.similarity > adaptive_threshold
  ORDER BY 
    -- For short queries, prioritize exact matches strongly
    CASE 
      WHEN keyword_count <= 2 THEN sr.exact_match_score
      ELSE (sr.exact_match_score * 0.5 + sr.similarity * 0.5)
    END DESC,
    -- Secondary sort by title length (more specific titles first)
    length(sr.title) ASC
  LIMIT match_count;
END;
$$;