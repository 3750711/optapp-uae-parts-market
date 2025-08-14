-- Fix hybrid_search_products function to include products without embeddings
CREATE OR REPLACE FUNCTION public.hybrid_search_products(
  query_embedding vector(1536),
  search_keywords text,
  similarity_threshold real DEFAULT 0.3,
  match_count integer DEFAULT 20,
  query_length integer DEFAULT 1
)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  price numeric,
  brand text,
  model text,
  condition text,
  seller_name text,
  seller_id uuid,
  location text,
  product_location text,
  telegram_url text,
  phone_url text,
  lot_number integer,
  place_number integer,
  delivery_price numeric,
  status product_status,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  rating_seller numeric,
  optid_created text,
  view_count integer,
  product_url text,
  cloudinary_url text,
  preview_image_url text,
  similarity double precision,
  exact_match_score double precision,
  hybrid_score double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.id,
    p.title,
    p.description,
    p.price,
    p.brand,
    p.model,
    p.condition,
    p.seller_name,
    p.seller_id,
    p.location,
    p.product_location,
    p.telegram_url,
    p.phone_url,
    p.lot_number,
    p.place_number,
    p.delivery_price,
    p.status,
    p.created_at,
    p.updated_at,
    p.rating_seller,
    p.optid_created,
    p.view_count,
    p.product_url,
    p.cloudinary_url,
    p.preview_image_url,
    -- Similarity score (0 for products without embeddings)
    COALESCE(1 - (pe.embedding <=> query_embedding), 0) AS similarity,
    -- Exact match score using trigram similarity
    GREATEST(
      similarity(COALESCE(p.title, ''), search_keywords),
      similarity(COALESCE(p.description, ''), search_keywords),
      similarity(COALESCE(p.brand, ''), search_keywords),
      similarity(COALESCE(p.model, ''), search_keywords)
    ) AS exact_match_score,
    -- Hybrid score combining semantic and exact match
    CASE 
      WHEN pe.embedding IS NOT NULL THEN
        -- Products with embeddings: weighted combination
        (0.7 * (1 - (pe.embedding <=> query_embedding))) + 
        (0.3 * GREATEST(
          similarity(COALESCE(p.title, ''), search_keywords),
          similarity(COALESCE(p.description, ''), search_keywords),
          similarity(COALESCE(p.brand, ''), search_keywords),
          similarity(COALESCE(p.model, ''), search_keywords)
        ))
      ELSE
        -- Products without embeddings: text-only score
        GREATEST(
          similarity(COALESCE(p.title, ''), search_keywords),
          similarity(COALESCE(p.description, ''), search_keywords),
          similarity(COALESCE(p.brand, ''), search_keywords),
          similarity(COALESCE(p.model, ''), search_keywords)
        )
    END AS hybrid_score
  FROM 
    public.products p
  LEFT JOIN 
    public.product_embeddings pe ON p.id = pe.product_id
  WHERE 
    p.status = 'active'
    AND (
      -- Include products with embeddings that meet similarity threshold
      (pe.embedding IS NOT NULL AND (1 - (pe.embedding <=> query_embedding)) > similarity_threshold)
      OR
      -- Include products without embeddings that match text search
      (pe.embedding IS NULL AND (
        p.title ILIKE '%' || search_keywords || '%' OR
        p.description ILIKE '%' || search_keywords || '%' OR
        p.brand ILIKE '%' || search_keywords || '%' OR
        p.model ILIKE '%' || search_keywords || '%'
      ))
    )
  ORDER BY 
    -- Prioritize products with embeddings, then by hybrid score
    CASE WHEN pe.embedding IS NOT NULL THEN 1 ELSE 2 END,
    CASE 
      WHEN pe.embedding IS NOT NULL THEN
        (0.7 * (1 - (pe.embedding <=> query_embedding))) + 
        (0.3 * GREATEST(
          similarity(COALESCE(p.title, ''), search_keywords),
          similarity(COALESCE(p.description, ''), search_keywords),
          similarity(COALESCE(p.brand, ''), search_keywords),
          similarity(COALESCE(p.model, ''), search_keywords)
        ))
      ELSE
        GREATEST(
          similarity(COALESCE(p.title, ''), search_keywords),
          similarity(COALESCE(p.description, ''), search_keywords),
          similarity(COALESCE(p.brand, ''), search_keywords),
          similarity(COALESCE(p.model, ''), search_keywords)
        )
    END DESC
  LIMIT match_count;
END;
$$;