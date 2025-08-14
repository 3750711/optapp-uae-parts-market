-- Improve hybrid_search_products to prioritize exact matches
DROP FUNCTION IF EXISTS public.hybrid_search_products(vector, text, real, integer, integer);

CREATE OR REPLACE FUNCTION public.hybrid_search_products(
  query_embedding vector(1536),
  search_keywords text,
  similarity_threshold real DEFAULT 0.3,
  match_count integer DEFAULT 50,
  query_length integer DEFAULT 1
)
RETURNS TABLE (
  id uuid,
  title text,
  price numeric,
  images text[],
  seller_id uuid,
  seller_name text,
  rating_seller numeric,
  optid_created text,
  brand text,
  model text,
  status product_status,
  created_at timestamp with time zone,
  view_count integer,
  similarity real,
  exact_match_score real,
  hybrid_score real
)
LANGUAGE plpgsql
AS $$
DECLARE
  alpha real := 0.6; -- Weight for semantic similarity
  beta real := 0.4;  -- Weight for keyword matching
  search_keywords_lower text;
  keywords text[];
  keyword text;
  total_keywords integer;
BEGIN
  -- Normalize and split keywords
  search_keywords_lower := lower(trim(search_keywords));
  keywords := string_to_array(search_keywords_lower, ' ');
  total_keywords := array_length(keywords, 1);
  
  -- If no keywords provided, return empty result
  IF total_keywords = 0 OR search_keywords_lower = '' THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.price,
    p.images,
    p.seller_id,
    p.seller_name,
    p.rating_seller,
    p.optid_created,
    p.brand,
    p.model,
    p.status,
    p.created_at,
    p.view_count,
    -- Semantic similarity
    GREATEST(0, 1 - (p.embedding <=> query_embedding))::real as similarity,
    -- Exact match score calculation
    (
      CASE 
        WHEN total_keywords = 0 THEN 0
        ELSE
          (
            -- Count exact matches in title
            (CASE WHEN lower(p.title) LIKE '%' || search_keywords_lower || '%' THEN 1.0 ELSE 0.0 END) +
            -- Count exact matches in brand
            (CASE WHEN lower(COALESCE(p.brand, '')) LIKE '%' || search_keywords_lower || '%' THEN 0.8 ELSE 0.0 END) +
            -- Count exact matches in model  
            (CASE WHEN lower(COALESCE(p.model, '')) LIKE '%' || search_keywords_lower || '%' THEN 0.8 ELSE 0.0 END) +
            -- Individual keyword matches
            (
              SELECT COALESCE(SUM(
                CASE 
                  WHEN lower(p.title) LIKE '%' || kw || '%' THEN 0.6
                  WHEN lower(COALESCE(p.brand, '')) LIKE '%' || kw || '%' THEN 0.4
                  WHEN lower(COALESCE(p.model, '')) LIKE '%' || kw || '%' THEN 0.4
                  ELSE 0.0
                END
              ), 0) FROM unnest(keywords) as kw
            )
          ) / (total_keywords + 1.0) -- Normalize by keyword count + full phrase
      END
    )::real as exact_match_score,
    -- Hybrid score combining both
    (
      alpha * GREATEST(0, 1 - (p.embedding <=> query_embedding)) +
      beta * (
        CASE 
          WHEN total_keywords = 0 THEN 0
          ELSE
            (
              -- Full phrase bonus
              (CASE WHEN lower(p.title) LIKE '%' || search_keywords_lower || '%' THEN 1.0 ELSE 0.0 END) +
              (CASE WHEN lower(COALESCE(p.brand, '')) LIKE '%' || search_keywords_lower || '%' THEN 0.8 ELSE 0.0 END) +
              (CASE WHEN lower(COALESCE(p.model, '')) LIKE '%' || search_keywords_lower || '%' THEN 0.8 ELSE 0.0 END) +
              -- Individual keyword scoring
              (
                SELECT COALESCE(SUM(
                  CASE 
                    WHEN lower(p.title) LIKE '%' || kw || '%' THEN 0.6
                    WHEN lower(COALESCE(p.brand, '')) LIKE '%' || kw || '%' THEN 0.4
                    WHEN lower(COALESCE(p.model, '')) LIKE '%' || kw || '%' THEN 0.4
                    ELSE 0.0
                  END
                ), 0) FROM unnest(keywords) as kw
              )
            ) / (total_keywords + 1.0)
        END
      )
    )::real as hybrid_score
  FROM products p
  WHERE 
    p.status IN ('active', 'sold') 
    AND p.embedding IS NOT NULL
    AND (
      -- Semantic similarity threshold
      (p.embedding <=> query_embedding) < (1 - similarity_threshold)
      OR
      -- Keyword match exists
      (
        lower(p.title) LIKE '%' || search_keywords_lower || '%' OR
        lower(COALESCE(p.brand, '')) LIKE '%' || search_keywords_lower || '%' OR
        lower(COALESCE(p.model, '')) LIKE '%' || search_keywords_lower || '%' OR
        EXISTS (
          SELECT 1 FROM unnest(keywords) as kw 
          WHERE lower(p.title) LIKE '%' || kw || '%'
             OR lower(COALESCE(p.brand, '')) LIKE '%' || kw || '%'
             OR lower(COALESCE(p.model, '')) LIKE '%' || kw || '%'
        )
      )
    )
  ORDER BY 
    exact_match_score DESC,
    hybrid_score DESC,
    p.created_at DESC
  LIMIT match_count;
END;
$$;