-- Update the semantic_search_products function to use proper cosine similarity
CREATE OR REPLACE FUNCTION public.semantic_search_products(
    query_embedding vector(1536),
    similarity_threshold float DEFAULT 0.3,
    match_count int DEFAULT 20
)
RETURNS TABLE (
    product_id uuid,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pe.product_id,
    1 - (pe.embedding <=> query_embedding) as similarity
  FROM product_embeddings pe
  WHERE 1 - (pe.embedding <=> query_embedding) > similarity_threshold
  ORDER BY pe.embedding <=> query_embedding ASC
  LIMIT match_count;
END;
$$;