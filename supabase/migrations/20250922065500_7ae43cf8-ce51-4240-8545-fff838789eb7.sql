-- Create search analytics table for semantic search tracking
CREATE TABLE IF NOT EXISTS public.search_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query TEXT NOT NULL,
  results_count INTEGER NOT NULL DEFAULT 0,
  threshold NUMERIC NOT NULL DEFAULT 0.7,
  filters JSONB NOT NULL DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS
ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for search analytics
CREATE POLICY "System can insert search analytics" 
ON public.search_analytics 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Only admins can view search analytics" 
ON public.search_analytics 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_search_analytics_created_at ON public.search_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON public.search_analytics USING gin(to_tsvector('english', query));

-- Add helpful comment
COMMENT ON TABLE public.search_analytics IS 'Analytics tracking for semantic search queries and results';