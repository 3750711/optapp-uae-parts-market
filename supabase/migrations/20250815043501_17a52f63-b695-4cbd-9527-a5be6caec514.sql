-- Update hybrid_search_products to use only semantic search
CREATE OR REPLACE FUNCTION public.hybrid_search_products(
  query_embedding vector(1536),
  similarity_threshold double precision DEFAULT 0.2,
  match_count integer DEFAULT 100
)
RETURNS TABLE(
  id uuid,
  title text,
  brand text,
  model text,
  price numeric,
  seller_name text,
  preview_image_url text,
  status product_status,
  created_at timestamp with time zone,
  similarity_score double precision,
  semantic_score double precision
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
    -- Semantic similarity score (0 to 1, higher is better)
    (1 - (pe.embedding <=> query_embedding)) AS similarity_score,
    -- Use same score for semantic_score (for compatibility)
    (1 - (pe.embedding <=> query_embedding)) AS semantic_score
  FROM public.products p
  LEFT JOIN public.product_embeddings pe ON p.id = pe.product_id
  WHERE pe.embedding IS NOT NULL
    AND (1 - (pe.embedding <=> query_embedding)) >= similarity_threshold
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;