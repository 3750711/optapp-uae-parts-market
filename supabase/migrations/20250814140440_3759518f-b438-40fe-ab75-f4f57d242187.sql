-- Create or replace the improved hybrid_search_products function
CREATE OR REPLACE FUNCTION hybrid_search_products(
  query_embedding vector(1536),
  search_keywords text,
  similarity_threshold float DEFAULT 0.3,
  match_count int DEFAULT 50,
  query_length int DEFAULT 2
)
RETURNS TABLE (
  product_id uuid,
  similarity float,
  exact_match_score float,
  hybrid_score float,
  title text,
  price numeric,
  brand text,
  model text,
  status product_status
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as product_id,
    GREATEST(0, 1 - (pe.embedding <=> query_embedding)) as similarity,
    CASE 
      WHEN p.title ILIKE '%' || search_keywords || '%' THEN 1.0
      WHEN p.brand ILIKE '%' || search_keywords || '%' OR p.model ILIKE '%' || search_keywords || '%' THEN 0.8
      WHEN similarity(LOWER(p.title), LOWER(search_keywords)) > 0.3 THEN similarity(LOWER(p.title), LOWER(search_keywords))
      ELSE 0.0
    END as exact_match_score,
    CASE 
      WHEN query_length <= 2 THEN 
        -- For short queries: prioritize exact matches more (70/30)
        (CASE 
          WHEN p.title ILIKE '%' || search_keywords || '%' THEN 1.0
          WHEN p.brand ILIKE '%' || search_keywords || '%' OR p.model ILIKE '%' || search_keywords || '%' THEN 0.8
          WHEN similarity(LOWER(p.title), LOWER(search_keywords)) > 0.3 THEN similarity(LOWER(p.title), LOWER(search_keywords))
          ELSE 0.0
        END) * 0.7 + GREATEST(0, 1 - (pe.embedding <=> query_embedding)) * 0.3
      ELSE 
        -- For longer queries: balance exact and semantic (50/50)
        (CASE 
          WHEN p.title ILIKE '%' || search_keywords || '%' THEN 1.0
          WHEN p.brand ILIKE '%' || search_keywords || '%' OR p.model ILIKE '%' || search_keywords || '%' THEN 0.8
          WHEN similarity(LOWER(p.title), LOWER(search_keywords)) > 0.3 THEN similarity(LOWER(p.title), LOWER(search_keywords))
          ELSE 0.0
        END) * 0.5 + GREATEST(0, 1 - (pe.embedding <=> query_embedding)) * 0.5
    END as hybrid_score,
    p.title,
    p.price,
    p.brand,
    p.model,
    p.status
  FROM products p
  INNER JOIN product_embeddings pe ON p.id = pe.product_id
  WHERE 
    pe.embedding IS NOT NULL
    AND (pe.embedding <=> query_embedding) < similarity_threshold
    AND p.deleted_at IS NULL
    -- Filter out products with very poor similarity scores
    AND GREATEST(0, 1 - (pe.embedding <=> query_embedding)) > 0.1
  ORDER BY
    -- First priority: active status
    CASE WHEN p.status = 'active' THEN 0 ELSE 1 END ASC,
    -- Second priority: hybrid_score (main ranking criterion)
    hybrid_score DESC,
    -- Third priority: newer products first (tie-breaker)
    p.id DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;