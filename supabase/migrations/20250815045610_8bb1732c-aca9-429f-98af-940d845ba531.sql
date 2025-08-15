-- Fix price type mismatch in hybrid_search_products function
CREATE OR REPLACE FUNCTION public.hybrid_search_products(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.2,
  match_count int DEFAULT 100,
  query_words text[] DEFAULT '{}'::text[]
)
RETURNS TABLE (
  id uuid,
  title text,
  brand text,
  model text,
  price double precision,  -- Changed from numeric to double precision
  seller_name text,
  preview_image_url text,
  status product_status,
  created_at timestamp with time zone,
  similarity_score float,
  match_score float,
  semantic_score float,
  final_score float
)
LANGUAGE plpgsql
AS $$
DECLARE
  word text;
  total_words int;
BEGIN
  -- Get total number of query words for normalization
  total_words := array_length(query_words, 1);
  IF total_words IS NULL THEN
    total_words := 0;
  END IF;

  RETURN QUERY
  WITH semantic_results AS (
    SELECT 
      p.id,
      p.title,
      p.brand,
      p.model,
      p.price::double precision,  -- Cast numeric to double precision
      p.seller_name,
      pi.url as preview_image_url,
      p.status,
      p.created_at,
      (1 - (pe.embedding <=> query_embedding)) as semantic_score
    FROM products p
    LEFT JOIN product_embeddings pe ON p.id = pe.product_id
    LEFT JOIN (
      SELECT DISTINCT ON (product_id) 
        product_id, 
        url
      FROM product_images 
      WHERE is_primary = true
      ORDER BY product_id, product_images.created_at DESC
    ) pi ON p.id = pi.product_id
    WHERE pe.embedding IS NOT NULL
    AND (1 - (pe.embedding <=> query_embedding)) >= similarity_threshold
    AND p.status IN ('active', 'sold')
  ),
  scored_results AS (
    SELECT 
      sr.*,
      CASE 
        WHEN total_words = 0 THEN 0
        ELSE (
          -- Calculate match score based on word matches in different fields
          (
            -- Title matches (weight 1.5)
            (
              SELECT COUNT(*) * 1.5
              FROM unnest(query_words) AS query_word
              WHERE LOWER(COALESCE(sr.title, '')) ILIKE '%' || LOWER(query_word) || '%'
              AND LENGTH(query_word) > 1
            ) +
            -- Brand matches (weight 1.2)
            (
              SELECT COUNT(*) * 1.2
              FROM unnest(query_words) AS query_word
              WHERE LOWER(COALESCE(sr.brand, '')) ILIKE '%' || LOWER(query_word) || '%'
              AND LENGTH(query_word) > 1
            ) +
            -- Model matches (weight 1.2)
            (
              SELECT COUNT(*) * 1.2
              FROM unnest(query_words) AS query_word
              WHERE LOWER(COALESCE(sr.model, '')) ILIKE '%' || LOWER(query_word) || '%'
              AND LENGTH(query_word) > 1
            ) +
            -- Exact word matches bonus (weight 2.0)
            (
              SELECT COUNT(*) * 2.0
              FROM unnest(query_words) AS query_word
              WHERE (
                ' ' || LOWER(COALESCE(sr.title, '')) || ' ' ILIKE '% ' || LOWER(query_word) || ' %' OR
                ' ' || LOWER(COALESCE(sr.brand, '')) || ' ' ILIKE '% ' || LOWER(query_word) || ' %' OR
                ' ' || LOWER(COALESCE(sr.model, '')) || ' ' ILIKE '% ' || LOWER(query_word) || ' %'
              )
              AND LENGTH(query_word) > 1
            )
          ) / (total_words * 2.5) -- Normalize by max possible score
        )
      END as match_score
    FROM semantic_results sr
  )
  SELECT 
    scored.id,
    scored.title,
    scored.brand,
    scored.model,
    scored.price,
    scored.seller_name,
    scored.preview_image_url,
    scored.status,
    scored.created_at,
    scored.semantic_score as similarity_score,
    scored.match_score,
    scored.semantic_score,
    -- Final hybrid score: 50% semantic + 50% keyword matching
    (scored.semantic_score * 0.5 + scored.match_score * 0.5) as final_score
  FROM scored_results scored
  ORDER BY final_score DESC, scored.semantic_score DESC
  LIMIT match_count;
END;
$$;