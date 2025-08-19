-- Fix remaining functions that are missing search_path
-- These are likely vector extension functions and other system functions

-- Set search_path for vector functions (if they exist in our database)
ALTER FUNCTION public.vector_in(cstring, oid, integer) SET search_path = 'public';
ALTER FUNCTION public.vector_out(vector) SET search_path = 'public';
ALTER FUNCTION public.vector_typmod_in(cstring[]) SET search_path = 'public';
ALTER FUNCTION public.vector_recv(internal, oid, integer) SET search_path = 'public';
ALTER FUNCTION public.vector_send(vector) SET search_path = 'public';
ALTER FUNCTION public.l2_distance(vector, vector) SET search_path = 'public';
ALTER FUNCTION public.inner_product(vector, vector) SET search_path = 'public';
ALTER FUNCTION public.cosine_distance(vector, vector) SET search_path = 'public';
ALTER FUNCTION public.l1_distance(vector, vector) SET search_path = 'public';
ALTER FUNCTION public.vector_dims(vector) SET search_path = 'public';
ALTER FUNCTION public.vector_norm(vector) SET search_path = 'public';
ALTER FUNCTION public.l2_normalize(vector) SET search_path = 'public';
ALTER FUNCTION public.binary_quantize(vector) SET search_path = 'public';
ALTER FUNCTION public.subvector(vector, integer, integer) SET search_path = 'public';
ALTER FUNCTION public.vector_add(vector, vector) SET search_path = 'public';
ALTER FUNCTION public.vector_sub(vector, vector) SET search_path = 'public';
ALTER FUNCTION public.vector_mul(vector, vector) SET search_path = 'public';
ALTER FUNCTION public.vector_concat(vector, vector) SET search_path = 'public';
ALTER FUNCTION public.vector_lt(vector, vector) SET search_path = 'public';
ALTER FUNCTION public.vector_le(vector, vector) SET search_path = 'public';
ALTER FUNCTION public.vector_eq(vector, vector) SET search_path = 'public';
ALTER FUNCTION public.vector_ne(vector, vector) SET search_path = 'public';
ALTER FUNCTION public.vector_ge(vector, vector) SET search_path = 'public';
ALTER FUNCTION public.vector_gt(vector, vector) SET search_path = 'public';
ALTER FUNCTION public.vector_cmp(vector, vector) SET search_path = 'public';
ALTER FUNCTION public.vector_l2_squared_distance(vector, vector) SET search_path = 'public';
ALTER FUNCTION public.vector_negative_inner_product(vector, vector) SET search_path = 'public';
ALTER FUNCTION public.vector_spherical_distance(vector, vector) SET search_path = 'public';
ALTER FUNCTION public.vector_accum(double precision[], vector) SET search_path = 'public';
ALTER FUNCTION public.vector_avg(double precision[]) SET search_path = 'public';
ALTER FUNCTION public.vector_combine(double precision[], double precision[]) SET search_path = 'public';

-- Set search_path for trigram functions
ALTER FUNCTION public.set_limit(real) SET search_path = 'public';
ALTER FUNCTION public.show_limit() SET search_path = 'public';
ALTER FUNCTION public.show_trgm(text) SET search_path = 'public';
ALTER FUNCTION public.similarity(text, text) SET search_path = 'public';
ALTER FUNCTION public.similarity_op(text, text) SET search_path = 'public';
ALTER FUNCTION public.word_similarity(text, text) SET search_path = 'public';
ALTER FUNCTION public.word_similarity_op(text, text) SET search_path = 'public';
ALTER FUNCTION public.word_similarity_commutator_op(text, text) SET search_path = 'public';
ALTER FUNCTION public.similarity_dist(text, text) SET search_path = 'public';
ALTER FUNCTION public.word_similarity_dist_op(text, text) SET search_path = 'public';
ALTER FUNCTION public.word_similarity_dist_commutator_op(text, text) SET search_path = 'public';
ALTER FUNCTION public.gtrgm_in(cstring) SET search_path = 'public';
ALTER FUNCTION public.gtrgm_out(gtrgm) SET search_path = 'public';
ALTER FUNCTION public.gtrgm_consistent(internal, text, smallint, oid, internal) SET search_path = 'public';
ALTER FUNCTION public.gtrgm_distance(internal, text, smallint, oid, internal) SET search_path = 'public';
ALTER FUNCTION public.gtrgm_compress(internal) SET search_path = 'public';
ALTER FUNCTION public.gtrgm_decompress(internal) SET search_path = 'public';

-- Create additional security functions
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_seller()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'seller'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  );
$$;