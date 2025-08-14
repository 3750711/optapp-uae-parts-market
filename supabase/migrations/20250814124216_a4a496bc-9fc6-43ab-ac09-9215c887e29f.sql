-- Update semantic_search_products function to use 0.3 similarity threshold by default
CREATE OR REPLACE FUNCTION semantic_search_products(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.3,
  match_count int DEFAULT 50
)
RETURNS TABLE (
  product_id text,
  similarity float
)
LANGUAGE sql
AS $$
  SELECT 
    pe.product_id::text,
    (1 - (pe.embedding <=> query_embedding)) as similarity
  FROM product_embeddings pe
  WHERE (1 - (pe.embedding <=> query_embedding)) > similarity_threshold
  ORDER BY pe.embedding <=> query_embedding ASC
  LIMIT match_count;
$$;