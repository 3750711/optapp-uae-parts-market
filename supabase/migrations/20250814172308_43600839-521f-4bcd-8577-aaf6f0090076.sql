-- Drop all existing versions of hybrid_search_products function
DROP FUNCTION IF EXISTS public.hybrid_search_products(vector, text, real, integer, integer) CASCADE;
DROP FUNCTION IF EXISTS public.hybrid_search_products(vector, text, double precision, integer, integer) CASCADE;
DROP FUNCTION IF EXISTS public.hybrid_search_products(public.vector, text, real, integer, integer) CASCADE;
DROP FUNCTION IF EXISTS public.hybrid_search_products(public.vector, text, double precision, integer, integer) CASCADE;

-- Create unified hybrid_search_products function with consistent types
CREATE OR REPLACE FUNCTION public.hybrid_search_products(
  query_embedding vector(1536),
  search_keywords text,
  similarity_threshold double precision DEFAULT 0.3,
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
DECLARE
  weighted_keywords text;
BEGIN
  -- Create weighted keyword string for exact matching
  weighted_keywords := search_keywords;
  
  RETURN QUERY
  SELECT 
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
    -- Calculate cosine similarity
    (1 - (pe.embedding <=> query_embedding))::double precision as similarity,
    -- Calculate exact match score
    GREATEST(
      COALESCE(similarity(LOWER(p.title), LOWER(weighted_keywords)), 0),
      COALESCE(similarity(LOWER(p.brand), LOWER(weighted_keywords)), 0),
      COALESCE(similarity(LOWER(p.model), LOWER(weighted_keywords)), 0),
      COALESCE(similarity(LOWER(p.description), LOWER(weighted_keywords)), 0)
    )::double precision as exact_match_score,
    -- Calculate hybrid score (weighted combination)
    (
      0.4 * GREATEST(
        COALESCE(similarity(LOWER(p.title), LOWER(weighted_keywords)), 0),
        COALESCE(similarity(LOWER(p.brand), LOWER(weighted_keywords)), 0),
        COALESCE(similarity(LOWER(p.model), LOWER(weighted_keywords)), 0),
        COALESCE(similarity(LOWER(p.description), LOWER(weighted_keywords)), 0)
      ) + 
      0.6 * (1 - (pe.embedding <=> query_embedding))
    )::double precision as hybrid_score
  FROM 
    public.products p
  LEFT JOIN 
    public.product_embeddings pe ON p.id = pe.product_id
  WHERE 
    p.status IN ('active', 'sold')
    AND pe.embedding IS NOT NULL
    AND (
      (1 - (pe.embedding <=> query_embedding)) >= similarity_threshold
      OR similarity(LOWER(p.title), LOWER(weighted_keywords)) >= 0.3
      OR similarity(LOWER(p.brand), LOWER(weighted_keywords)) >= 0.3
      OR similarity(LOWER(p.model), LOWER(weighted_keywords)) >= 0.3
      OR similarity(LOWER(p.description), LOWER(weighted_keywords)) >= 0.3
    )
  ORDER BY 
    -- First by exact match score (highest first)
    GREATEST(
      COALESCE(similarity(LOWER(p.title), LOWER(weighted_keywords)), 0),
      COALESCE(similarity(LOWER(p.brand), LOWER(weighted_keywords)), 0),
      COALESCE(similarity(LOWER(p.model), LOWER(weighted_keywords)), 0),
      COALESCE(similarity(LOWER(p.description), LOWER(weighted_keywords)), 0)
    ) DESC,
    -- Then by hybrid score (highest first)
    (
      0.4 * GREATEST(
        COALESCE(similarity(LOWER(p.title), LOWER(weighted_keywords)), 0),
        COALESCE(similarity(LOWER(p.brand), LOWER(weighted_keywords)), 0),
        COALESCE(similarity(LOWER(p.model), LOWER(weighted_keywords)), 0),
        COALESCE(similarity(LOWER(p.description), LOWER(weighted_keywords)), 0)
      ) + 
      0.6 * (1 - (pe.embedding <=> query_embedding))
    ) DESC
  LIMIT match_count;
END;
$$;