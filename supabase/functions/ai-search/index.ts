import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { query, similarityThreshold = 0.2, matchCount = 100 } = await req.json();
    
    if (!query || typeof query !== 'string') {
      throw new Error('Query parameter is required and must be a string');
    }
    
    console.log('AI search query:', query);

    // Normalize and split query into words for keyword matching
    const queryWords = query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .split(/\s+/)
      .filter(word => word.length > 1); // Filter out single characters
    
    console.log('Query words for matching:', queryWords);

    // Generate embedding for the search query
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query,
        encoding_format: 'float',
      }),
    });

    if (!embeddingResponse.ok) {
      throw new Error(`OpenAI API error: ${embeddingResponse.statusText}`);
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    console.log('Generated query embedding, searching for similar products...');

    // Perform semantic search
    console.log('Performing semantic search...');
    
    console.log('Calling hybrid_search_products with:', {
      similarity_threshold: similarityThreshold,
      match_count: matchCount
    });

    const { data: searchResults, error: searchError } = await supabase
      .rpc('hybrid_search_products', {
        query_embedding: queryEmbedding,
        similarity_threshold: similarityThreshold,
        match_count: matchCount,
        query_words: queryWords
      });

    console.log('Search result status:', { 
      hasError: !!searchError, 
      dataLength: searchResults?.length 
    });

    if (searchError) {
      console.error('Error in semantic search:', {
        error: searchError,
        code: searchError.code,
        message: searchError.message,
        details: searchError.details,
        hint: searchError.hint
      });
      throw searchError;
    }

    console.log(`Found ${searchResults?.length || 0} total matches`);
    
    // Results are already sorted by semantic similarity (best first)
    // Just limit to maximum 20 results
    const finalResults = searchResults ? searchResults.slice(0, 20) : [];
    
    if (finalResults.length > 0) {
      // Log score distribution for debugging
      console.log('Score distribution:', {
        totalResults: finalResults.length,
        avgSemanticScore: finalResults.reduce((sum, r) => sum + r.semantic_score, 0) / finalResults.length,
        avgMatchScore: finalResults.reduce((sum, r) => sum + (r.match_score || 0), 0) / finalResults.length,
        avgFinalScore: finalResults.reduce((sum, r) => sum + (r.final_score || 0), 0) / finalResults.length,
        bestFinalScore: finalResults[0]?.final_score || 0,
        worstFinalScore: finalResults[finalResults.length - 1]?.final_score || 0
      });
    }

    console.log(`Returning ${finalResults?.length || 0} similar products`);
    console.log('Semantic search results sample:', finalResults?.slice(0, 3));

    // Return the results with similarity scores
    const result = {
      success: true,
      query,
      results: finalResults || [],
      count: finalResults?.length || 0
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-search function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});