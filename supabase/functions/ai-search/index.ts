import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Text filtering function to improve relevance
function applyTextFiltering(results: any[], query: string): any[] {
  const queryLower = query.toLowerCase();
  
  // Define irrelevant keywords that should be filtered out for specific queries
  const irrelevantKeywords: { [key: string]: string[] } = {
    'двигатель': ['крышка', 'ноускат', 'капот', 'крыло', 'бампер', 'фара', 'багажник', 'дверь', 'стекло'],
    'мотор': ['крышка', 'ноускат', 'капот', 'крыло', 'бампер', 'фара', 'багажник', 'дверь', 'стекло'],
    'двс': ['крышка', 'ноускат', 'капот', 'крыло', 'бампер', 'фара', 'багажник', 'дверь', 'стекло']
  };
  
  // Relevant keywords that should be prioritized for specific queries
  const relevantKeywords: { [key: string]: string[] } = {
    'двигатель': ['двс', 'двигатель', 'мотор', 'engine', 'блок'],
    'мотор': ['двс', 'двигатель', 'мотор', 'engine', 'блок'],
    'двс': ['двс', 'двигатель', 'мотор', 'engine', 'блок']
  };
  
  // Find the most relevant query category
  let applicableIrrelevant: string[] = [];
  let applicableRelevant: string[] = [];
  
  for (const [category, keywords] of Object.entries(irrelevantKeywords)) {
    if (queryLower.includes(category)) {
      applicableIrrelevant = keywords;
      applicableRelevant = relevantKeywords[category] || [];
      break;
    }
  }
  
  // If no specific category found, return original results
  if (applicableIrrelevant.length === 0) {
    return results;
  }
  
  // Filter out irrelevant results and boost relevant ones
  const filtered = results.filter(result => {
    const title = (result.title || '').toLowerCase();
    const brand = (result.brand || '').toLowerCase();
    
    // Check if title contains irrelevant keywords
    const hasIrrelevantKeywords = applicableIrrelevant.some(keyword => 
      title.includes(keyword)
    );
    
    // Exclude items with irrelevant keywords
    return !hasIrrelevantKeywords;
  });
  
  // Sort by relevance - prioritize items with relevant keywords
  return filtered.sort((a, b) => {
    const titleA = (a.title || '').toLowerCase();
    const titleB = (b.title || '').toLowerCase();
    
    const relevanceA = applicableRelevant.reduce((score, keyword) => 
      score + (titleA.includes(keyword) ? 1 : 0), 0
    );
    const relevanceB = applicableRelevant.reduce((score, keyword) => 
      score + (titleB.includes(keyword) ? 1 : 0), 0
    );
    
    // First sort by relevance keywords, then by similarity score
    if (relevanceA !== relevanceB) {
      return relevanceB - relevanceA;
    }
    
    return (b.similarity_score || 0) - (a.similarity_score || 0);
  });
}

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

    const { query, similarityThreshold, matchCount = 1000, offset = 0, limit = 20 } = await req.json();
    
    if (!query || typeof query !== 'string') {
      throw new Error('Query parameter is required and must be a string');
    }
    
    // Reduced threshold for better coverage (decreased from 0.8 to 0.6)
    const adaptiveThreshold = similarityThreshold || 0.6;
    
    console.log('AI semantic search query:', query);
    console.log('Query analysis:', { 
      adaptiveThreshold,
      originalThreshold: similarityThreshold 
    });

    // Generate embedding for the search query
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: `Найти конкретную автозапчасть: ${query} (исключить кузовные детали, аксессуары, салонные элементы)`,
        encoding_format: 'float',
      }),
    });

    if (!embeddingResponse.ok) {
      throw new Error(`OpenAI API error: ${embeddingResponse.statusText}`);
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    console.log('Generated query embedding, searching for similar products...');

    // Perform semantic search using simplified function
    console.log('Performing semantic search...');
    
    console.log('Calling semantic_search_products with:', {
      search_query: query,
      similarity_threshold: adaptiveThreshold,
      match_count: matchCount
    });

    const { data: searchResults, error: searchError } = await supabase
      .rpc('semantic_search_products', {
        query_embedding: queryEmbedding,
        search_query: query,
        similarity_threshold: adaptiveThreshold,
        match_count: matchCount
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
    
    // Apply text filtering for better relevance
    const filteredResults = searchResults ? applyTextFiltering(searchResults, query) : [];
    
    console.log(`After text filtering: ${filteredResults.length} matches`);
    
    // Return all filtered results without pagination (pagination handled in frontend)
    const totalCount = filteredResults.length;
    
    console.log(`Returning all ${totalCount} results without pagination`);
    
    if (filteredResults.length > 0) {
      // Log score distribution for debugging
      console.log('Score distribution:', {
        totalResults: filteredResults.length,
        avgSemanticScore: filteredResults.reduce((sum, r) => sum + (r.similarity_score || 0), 0) / filteredResults.length,
        avgCombinedScore: filteredResults.reduce((sum, r) => sum + (r.combined_score || 0), 0) / filteredResults.length,
        bestSemanticScore: filteredResults[0]?.similarity_score || 0,
        bestCombinedScore: filteredResults[0]?.combined_score || 0,
        worstSemanticScore: filteredResults[filteredResults.length - 1]?.similarity_score || 0,
        worstCombinedScore: filteredResults[filteredResults.length - 1]?.combined_score || 0
      });
      
      // Log top 3 results with detailed scoring for debugging
      console.log('Top 3 results with detailed scores:', filteredResults.slice(0, 3).map(r => {
        const similarity = r.similarity_score || 0;
        const combined = r.combined_score || 0;
        const boost = combined - similarity;
        
        return {
          id: r.id,
          title: r.title?.substring(0, 50) + '...',
          brand: r.brand,
          model: r.model,
          similarity_score: similarity,
          combined_score: combined,
          boost_applied: boost,
          ranking_factors: {
            base_similarity: similarity,
            brand_bonus: r.brand ? 'possible' : 'none',
            model_bonus: r.model ? 'possible' : 'none',
            title_bonus: 'possible'
          }
        };
      }));
    }

    console.log(`Returning all ${filteredResults.length} similar products`);
    console.log('Semantic search results sample:', filteredResults?.slice(0, 3));

    // Return all results without pagination (pagination handled in frontend)
    const result = {
      success: true,
      query,
      results: filteredResults || [],
      count: filteredResults?.length || 0,
      totalCount,
      hasNextPage: false, // Always false since we return all results
      currentPage: 1,
      totalPages: 1
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