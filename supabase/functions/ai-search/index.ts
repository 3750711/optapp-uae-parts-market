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

    // Calculate query length for hybrid scoring
    const queryLength = query.trim().split(/\s+/).length;
    
    console.log('AI search query:', query);
    console.log('Query length:', queryLength);

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

    // Perform two-stage filtered search for optimal results
    console.log('Performing two-stage filtered search...');
    
    // Perform hybrid search with improved parameters
    console.log('Calling hybrid_search_products with:', {
      similarity_threshold: similarityThreshold,
      match_count: matchCount,
      query_length: queryLength
    });

    const { data: exactMatches, error: exactError } = await supabase
      .rpc('hybrid_search_products', {
        query_embedding: queryEmbedding,
        search_keywords: query,
        similarity_threshold: similarityThreshold,
        match_count: matchCount,
        query_length: queryLength
      });

    console.log('Search result status:', { 
      hasError: !!exactError, 
      dataLength: exactMatches?.length 
    });

    if (exactError) {
      console.error('Error in hybrid search:', {
        error: exactError,
        code: exactError.code,
        message: exactError.message,
        details: exactError.details,
        hint: exactError.hint
      });
      throw exactError;
    }

    console.log(`Stage 1: Found ${exactMatches?.length || 0} total matches`);
    
    // Filter and prioritize results
    let finalResults = [];
    
    if (exactMatches && exactMatches.length > 0) {
      // Stage 1: Get high exact match score products (≥ 0.8)
      const highExactMatches = exactMatches.filter(item => item.exact_match_score >= 0.8);
      console.log(`High exact matches (≥0.8): ${highExactMatches.length}`);
      
      // Add high exact matches first
      finalResults = [...highExactMatches];
      
      // Stage 2: If we have less than 10 high exact matches, add products with good hybrid scores
      if (finalResults.length < 10) {
        const remainingSlots = Math.min(20 - finalResults.length, 15);
        const additionalMatches = exactMatches
          .filter(item => item.exact_match_score < 0.8 && item.hybrid_score >= 0.4)
          .slice(0, remainingSlots);
        
        console.log(`Adding ${additionalMatches.length} additional matches with good hybrid scores`);
        finalResults = [...finalResults, ...additionalMatches];
      }
      
      // Limit to maximum 20 results
      finalResults = finalResults.slice(0, 20);
      
      // Log score distribution for debugging
      console.log('Score distribution:', {
        highExact: finalResults.filter(r => r.exact_match_score >= 0.8).length,
        mediumExact: finalResults.filter(r => r.exact_match_score >= 0.5 && r.exact_match_score < 0.8).length,
        lowExact: finalResults.filter(r => r.exact_match_score < 0.5).length,
        avgExactScore: finalResults.reduce((sum, r) => sum + r.exact_match_score, 0) / finalResults.length,
        avgHybridScore: finalResults.reduce((sum, r) => sum + r.hybrid_score, 0) / finalResults.length
      });
    }
    
    const searchResults = finalResults;

    console.log(`Found ${searchResults?.length || 0} similar products`);
    console.log('Hybrid search results sample:', searchResults?.slice(0, 3));

    // Return the results with similarity scores
    const result = {
      success: true,
      query,
      results: searchResults || [],
      count: searchResults?.length || 0
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