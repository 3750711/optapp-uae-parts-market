import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient } from '../_shared/client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  query: string;
  limit?: number;
  threshold?: number;
  filters?: {
    brand?: string;
    location?: string;
    price_min?: number;
    price_max?: number;
    status?: string;
  };
}

interface SearchResult {
  id: string;
  title: string;
  brand: string;
  model: string;
  price: number;
  location: string;
  preview_image_url: string;
  similarity: number;
  seller_name: string;
  status: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, limit = 20, threshold = 0.7, filters = {} }: SearchRequest = await req.json();

    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔍 Semantic search request: "${query}" with limit ${limit}, threshold ${threshold}`);

    const supabase = createServiceClient();
    
    // Generate embedding for the search query
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('📡 Generating embedding for query...');
    
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query,
      }),
    });

    if (!embeddingResponse.ok) {
      const errorData = await embeddingResponse.text();
      console.error('OpenAI embedding error:', errorData);
      throw new Error('Failed to generate embedding');
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    console.log('✅ Embedding generated successfully');

    // Build the search query with filters
    let searchQuery = supabase
      .from('products')
      .select(`
        id,
        title,
        brand,
        model,
        price,
        location,
        preview_image_url,
        seller_name,
        status,
        product_embeddings!inner(embedding)
      `);

    // Apply filters
    if (filters.brand) {
      searchQuery = searchQuery.ilike('brand', `%${filters.brand}%`);
    }
    if (filters.location) {
      searchQuery = searchQuery.ilike('location', `%${filters.location}%`);
    }
    if (filters.price_min) {
      searchQuery = searchQuery.gte('price', filters.price_min);
    }
    if (filters.price_max) {
      searchQuery = searchQuery.lte('price', filters.price_max);
    }
    if (filters.status) {
      searchQuery = searchQuery.eq('status', filters.status);
    } else {
      // Default to active products only
      searchQuery = searchQuery.eq('status', 'active');
    }

    const { data: products, error: searchError } = await searchQuery.limit(100);

    if (searchError) {
      console.error('Database search error:', searchError);
      throw new Error('Failed to search products');
    }

    console.log(`📊 Found ${products?.length || 0} products with embeddings`);

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ results: [], total: 0, query }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate similarity scores
    const results: SearchResult[] = products
      .map((product: any) => {
        if (!product.product_embeddings?.[0]?.embedding) {
          return null;
        }

        const productEmbedding = product.product_embeddings[0].embedding;
        
        // Calculate cosine similarity
        const similarity = calculateCosineSimilarity(queryEmbedding, productEmbedding);
        
        return {
          id: product.id,
          title: product.title,
          brand: product.brand,
          model: product.model || '',
          price: product.price,
          location: product.location || 'Dubai',
          preview_image_url: product.preview_image_url,
          similarity,
          seller_name: product.seller_name,
          status: product.status,
        };
      })
      .filter((result): result is SearchResult => result !== null && result.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    console.log(`🎯 Returning ${results.length} results above threshold ${threshold}`);

    // Log search analytics
    try {
      await supabase.from('search_analytics').insert({
        query,
        results_count: results.length,
        threshold,
        filters: JSON.stringify(filters),
        created_at: new Date().toISOString(),
      });
    } catch (analyticsError) {
      console.warn('Failed to log search analytics:', analyticsError);
    }

    return new Response(
      JSON.stringify({
        results,
        total: results.length,
        query,
        threshold,
        processing_time: Date.now(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Semantic search error:', error);
    return new Response(
      JSON.stringify({ 
        error: (error instanceof Error ? error.message : 'Unknown error') || 'Internal server error',
        query: '',
        results: [],
        total: 0,
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  
  if (magnitude === 0) {
    return 0;
  }

  return dotProduct / magnitude;
}