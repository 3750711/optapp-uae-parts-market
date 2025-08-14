-- Drop existing hybrid_search_products function
DROP FUNCTION IF EXISTS public.hybrid_search_products(vector, text, double precision, integer, integer);

-- Create improved hybrid_search_products function with proper keyword matching
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
  keywords text[];
  keyword text;
  title_lower text;
  brand_lower text;
  model_lower text;
  combined_lower text;
BEGIN
  -- Adjust weights based on query length
  IF query_length <= 2 THEN
    exact_weight := 0.8::double precision;        -- 80% for short queries
    similarity_weight := 0.2::double precision;   -- 20% for short queries
  ELSE
    exact_weight := 0.6::double precision;        -- 60% for longer queries  
    similarity_weight := 0.4::double precision;   -- 40% for longer queries
  END IF;

  -- Split search keywords into array of words
  keywords := string_to_array(LOWER(TRIM(search_keywords)), ' ');

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
    
    -- Advanced exact match scoring
    (CASE 
      WHEN search_keywords = '' THEN 0.0::double precision
      ELSE
        (SELECT 
          CASE 
            -- Perfect match: all keywords found in title + brand + model
            WHEN (SELECT COUNT(*) FROM unnest(keywords) k WHERE 
              LOWER(p.title || ' ' || COALESCE(p.brand, '') || ' ' || COALESCE(p.model, '')) LIKE '%' || k || '%') = array_length(keywords, 1)
            THEN 1.0::double precision
            
            -- Strong match: all keywords found in brand + model 
            WHEN (SELECT COUNT(*) FROM unnest(keywords) k WHERE 
              LOWER(COALESCE(p.brand, '') || ' ' || COALESCE(p.model, '')) LIKE '%' || k || '%') = array_length(keywords, 1)
            THEN 0.9::double precision
            
            -- Good match: most keywords found in title
            WHEN (SELECT COUNT(*) FROM unnest(keywords) k WHERE 
              LOWER(p.title) LIKE '%' || k || '%') >= (array_length(keywords, 1) * 0.7)
            THEN 0.8::double precision
            
            -- Partial match: some keywords found
            WHEN (SELECT COUNT(*) FROM unnest(keywords) k WHERE 
              LOWER(p.title || ' ' || COALESCE(p.brand, '') || ' ' || COALESCE(p.model, '')) LIKE '%' || k || '%') > 0
            THEN (SELECT COUNT(*) FROM unnest(keywords) k WHERE 
              LOWER(p.title || ' ' || COALESCE(p.brand, '') || ' ' || COALESCE(p.model, '')) LIKE '%' || k || '%')::double precision / array_length(keywords, 1)::double precision * 0.6::double precision
            
            ELSE 0.0::double precision
          END
        )
    END) as exact_match_score,
    
    -- Hybrid score calculation
    (exact_weight * 
      (CASE 
        WHEN search_keywords = '' THEN 0.0::double precision
        ELSE
          (SELECT 
            CASE 
              -- Perfect match: all keywords found in title + brand + model
              WHEN (SELECT COUNT(*) FROM unnest(keywords) k WHERE 
                LOWER(p.title || ' ' || COALESCE(p.brand, '') || ' ' || COALESCE(p.model, '')) LIKE '%' || k || '%') = array_length(keywords, 1)
              THEN 1.0::double precision
              
              -- Strong match: all keywords found in brand + model 
              WHEN (SELECT COUNT(*) FROM unnest(keywords) k WHERE 
                LOWER(COALESCE(p.brand, '') || ' ' || COALESCE(p.model, '')) LIKE '%' || k || '%') = array_length(keywords, 1)
              THEN 0.9::double precision
              
              -- Good match: most keywords found in title
              WHEN (SELECT COUNT(*) FROM unnest(keywords) k WHERE 
                LOWER(p.title) LIKE '%' || k || '%') >= (array_length(keywords, 1) * 0.7)
              THEN 0.8::double precision
              
              -- Partial match: some keywords found
              WHEN (SELECT COUNT(*) FROM unnest(keywords) k WHERE 
                LOWER(p.title || ' ' || COALESCE(p.brand, '') || ' ' || COALESCE(p.model, '')) LIKE '%' || k || '%') > 0
              THEN (SELECT COUNT(*) FROM unnest(keywords) k WHERE 
                LOWER(p.title || ' ' || COALESCE(p.brand, '') || ' ' || COALESCE(p.model, '')) LIKE '%' || k || '%')::double precision / array_length(keywords, 1)::double precision * 0.6::double precision
              
              ELSE 0.0::double precision
            END
          )
      END) + 
      similarity_weight * (1::double precision - (pe.embedding <=> query_embedding))
    ) as hybrid_score,
    
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
    -- Then by hybrid score (descending) - this ensures exact matches appear first
    (exact_weight * 
      (CASE 
        WHEN search_keywords = '' THEN 0.0::double precision
        ELSE
          (SELECT 
            CASE 
              WHEN (SELECT COUNT(*) FROM unnest(string_to_array(LOWER(TRIM(search_keywords)), ' ')) k WHERE 
                LOWER(p.title || ' ' || COALESCE(p.brand, '') || ' ' || COALESCE(p.model, '')) LIKE '%' || k || '%') = array_length(string_to_array(LOWER(TRIM(search_keywords)), ' '), 1)
              THEN 1.0::double precision
              WHEN (SELECT COUNT(*) FROM unnest(string_to_array(LOWER(TRIM(search_keywords)), ' ')) k WHERE 
                LOWER(COALESCE(p.brand, '') || ' ' || COALESCE(p.model, '')) LIKE '%' || k || '%') = array_length(string_to_array(LOWER(TRIM(search_keywords)), ' '), 1)
              THEN 0.9::double precision
              WHEN (SELECT COUNT(*) FROM unnest(string_to_array(LOWER(TRIM(search_keywords)), ' ')) k WHERE 
                LOWER(p.title) LIKE '%' || k || '%') >= (array_length(string_to_array(LOWER(TRIM(search_keywords)), ' '), 1) * 0.7)
              THEN 0.8::double precision
              WHEN (SELECT COUNT(*) FROM unnest(string_to_array(LOWER(TRIM(search_keywords)), ' ')) k WHERE 
                LOWER(p.title || ' ' || COALESCE(p.brand, '') || ' ' || COALESCE(p.model, '')) LIKE '%' || k || '%') > 0
              THEN (SELECT COUNT(*) FROM unnest(string_to_array(LOWER(TRIM(search_keywords)), ' ')) k WHERE 
                LOWER(p.title || ' ' || COALESCE(p.brand, '') || ' ' || COALESCE(p.model, '')) LIKE '%' || k || '%')::double precision / array_length(string_to_array(LOWER(TRIM(search_keywords)), ' '), 1)::double precision * 0.6::double precision
              ELSE 0.0::double precision
            END
          )
      END) + 
      similarity_weight * (1::double precision - (pe.embedding <=> query_embedding))
    ) DESC,
    -- Finally by creation date (newest first)
    p.created_at DESC
  LIMIT match_count;
END;
$$;