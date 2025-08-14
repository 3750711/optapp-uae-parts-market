-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create product_embeddings table to store AI-generated vectors
CREATE TABLE IF NOT EXISTS public.product_embeddings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL, -- OpenAI text-embedding-3-small dimension
  content_hash TEXT NOT NULL, -- Hash of the content used to generate embedding
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(product_id)
);

-- Create index for vector similarity search (HNSW - Hierarchical Navigable Small World)
CREATE INDEX IF NOT EXISTS product_embeddings_embedding_idx 
ON public.product_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- Create index for product_id lookups
CREATE INDEX IF NOT EXISTS product_embeddings_product_id_idx 
ON public.product_embeddings (product_id);

-- Enable RLS
ALTER TABLE public.product_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_embeddings
CREATE POLICY "Public can view product embeddings" 
ON public.product_embeddings 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage product embeddings" 
ON public.product_embeddings 
FOR ALL 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Function to perform semantic search
CREATE OR REPLACE FUNCTION semantic_search_products(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.7,
  match_count int DEFAULT 20
)
RETURNS TABLE (
  product_id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    pe.product_id,
    (pe.embedding <#> query_embedding) * -1 + 1 as similarity
  FROM product_embeddings pe
  WHERE (pe.embedding <#> query_embedding) * -1 + 1 > similarity_threshold
  ORDER BY pe.embedding <#> query_embedding
  LIMIT match_count;
END;
$function$;

-- Function to get content for embedding generation
CREATE OR REPLACE FUNCTION get_product_content_for_embedding(product_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  content text;
BEGIN
  SELECT 
    CONCAT_WS(' ',
      p.title,
      p.description,
      p.brand,
      p.model,
      p.condition,
      'price', p.price,
      'location', p.product_location
    )
  INTO content
  FROM products p
  WHERE p.id = product_id;
  
  RETURN content;
END;
$function$;

-- Function to calculate content hash
CREATE OR REPLACE FUNCTION calculate_content_hash(content text)
RETURNS text
LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN encode(digest(content, 'sha256'), 'hex');
END;
$function$;

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_embeddings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Create trigger for updated_at
CREATE TRIGGER update_product_embeddings_updated_at
  BEFORE UPDATE ON public.product_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_product_embeddings_updated_at();