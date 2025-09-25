import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Brand/Model recognition patterns
const brandPatterns = {
  'toyota': ['toyota', 'тойота'],
  'mazda': ['mazda', 'мазда'], 
  'honda': ['honda', 'хонда'],
  'nissan': ['nissan', 'ниссан'],
  'mitsubishi': ['mitsubishi', 'митсубиси'],
  'subaru': ['subaru', 'субару'],
  'mercedes': ['mercedes', 'мерседес', 'benz'],
  'bmw': ['bmw', 'бмв'],
  'audi': ['audi', 'ауди'],
  'volkswagen': ['volkswagen', 'вольксваген', 'vw'],
  'ford': ['ford', 'форд'],
  'chevrolet': ['chevrolet', 'шевроле'],
  'hyundai': ['hyundai', 'хендай'],
  'kia': ['kia', 'киа'],
  'lexus': ['lexus', 'лексус'],
  'infiniti': ['infiniti', 'инфинити'],
  'acura': ['acura', 'акура']
};

const modelPatterns = {
  'camry': ['camry', 'камри'],
  'corolla': ['corolla', 'корролла'],
  'prius': ['prius', 'приус'],
  'rav4': ['rav4', 'рав4'],
  'highlander': ['highlander', 'хайлендер'],
  'land cruiser': ['land cruiser', 'ланд крузер', 'landcruiser'],
  'cx-5': ['cx-5', 'сх-5'],
  'mazda6': ['mazda6', 'мазда6', '6'],
  'mazda3': ['mazda3', 'мазда3', '3'],
  'civic': ['civic', 'цивик'],
  'accord': ['accord', 'аккорд'],
  'cr-v': ['cr-v', 'цр-в'],
  'pilot': ['pilot', 'пилот'],
  'x-trail': ['x-trail', 'икс-трейл'],
  'qashqai': ['qashqai', 'кашкай'],
  'teana': ['teana', 'теана'],
  'altima': ['altima', 'альтима'],
  'sprinter': ['sprinter', 'спринтер'],
  'vito': ['vito', 'вито'],
  'e-class': ['e-class', 'е-класс', 'e class'],
  'c-class': ['c-class', 'с-класс', 'c class']
};

// Auto parts synonyms and translations
const partSynonyms = {
  'ноускат': ['nose cut', 'передняя часть', 'морда', 'front end', 'передок'],
  'двигатель': ['engine', 'мотор', 'motor', 'движок'],
  'коробка': ['transmission', 'трансмиссия', 'gearbox', 'кпп'],
  'ходовая': ['suspension', 'подвеска', 'chassis'],
  'бампер': ['bumper', 'передний бампер', 'задний бампер'],
  'фара': ['headlight', 'фонарь', 'light'],
  'крыло': ['fender', 'wing', 'панель']
};

// Function to extract brand/model from query
function extractBrandModel(query: string): { brand?: string, model?: string } {
  const lowerQuery = query.toLowerCase();
  let detectedBrand = '';
  let detectedModel = '';
  
  // Find brand
  for (const [brand, patterns] of Object.entries(brandPatterns)) {
    if (patterns.some(pattern => lowerQuery.includes(pattern))) {
      detectedBrand = brand;
      break;
    }
  }
  
  // Find model
  for (const [model, patterns] of Object.entries(modelPatterns)) {
    if (patterns.some(pattern => lowerQuery.includes(pattern))) {
      detectedModel = model;
      break;
    }
  }
  
  return { 
    brand: detectedBrand || undefined, 
    model: detectedModel || undefined 
  };
}

// Function to enhance query with synonyms
function enhanceQuery(query: string): string {
  let enhancedQuery = query;
  const lowerQuery = query.toLowerCase();
  
  // Add synonyms for detected parts
  for (const [part, synonyms] of Object.entries(partSynonyms)) {
    if (lowerQuery.includes(part)) {
      enhancedQuery += ' ' + synonyms.join(' ');
    }
  }
  
  // Add brand/model context
  const { brand, model } = extractBrandModel(query);
  if (brand) {
    enhancedQuery += ` ${brand}`;
    if ((brandPatterns as any)[brand]) {
      enhancedQuery += ' ' + (brandPatterns as any)[brand].join(' ');
    }
  }
  if (model) {
    enhancedQuery += ` ${model}`;
    if ((modelPatterns as any)[model]) {
      enhancedQuery += ' ' + (modelPatterns as any)[model].join(' ');
    }
  }
  
  return enhancedQuery;
}

// Function to apply post-processing filtering
function applyPostProcessingFilter(results: any[], query: string): any[] {
  const { brand, model } = extractBrandModel(query);
  
  if (!brand && !model) {
    return results; // No specific brand/model, return all results
  }
  
  // Separate exact matches from partial matches
  const exactMatches = [];
  const partialMatches = [];
  const otherMatches = [];
  
  for (const result of results) {
    const resultBrand = result.brand?.toLowerCase() || '';
    const resultModel = result.model?.toLowerCase() || '';
    
    let brandMatch = false;
    let modelMatch = false;
    
    // Check brand match
    if (brand && (brandPatterns as any)[brand]) {
      brandMatch = (brandPatterns as any)[brand].some((pattern: string) => 
        resultBrand.includes(pattern) || pattern.includes(resultBrand)
      );
    }
    
    // Check model match  
    if (model && (modelPatterns as any)[model]) {
      modelMatch = (modelPatterns as any)[model].some((pattern: string) => 
        resultModel.includes(pattern) || pattern.includes(resultModel)
      );
    }
    
    // Categorize results
    if (brandMatch && modelMatch) {
      exactMatches.push({ ...result, boost_score: 0.2 });
    } else if (brandMatch || modelMatch) {
      partialMatches.push({ ...result, boost_score: 0.1 });
    } else {
      otherMatches.push(result);
    }
  }
  
  // Apply boost to similarity scores
  const applyBoost = (items: any[]) => items.map(item => ({
    ...item,
    combined_score: Math.min(1.0, (item.similarity_score || 0) + (item.boost_score || 0))
  }));
  
  // Combine results with exact matches first
  const boostedExact = applyBoost(exactMatches);
  const boostedPartial = applyBoost(partialMatches);
  const boostedOther = applyBoost(otherMatches);
  
  return [...boostedExact, ...boostedPartial, ...boostedOther];
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
    
    // Extract brand/model and enhance query
    const { brand, model } = extractBrandModel(query);
    const enhancedQuery = enhanceQuery(query);
    
    // Reduced threshold for better coverage with fallback mechanism
    const primaryThreshold = similarityThreshold || 0.52;
    const fallbackThreshold = 0.45;
    
    console.log('AI semantic search query:', query);
    console.log('Enhanced query:', enhancedQuery);
    console.log('Brand/Model detected:', { brand, model });
    console.log('Query analysis:', { 
      primaryThreshold,
      fallbackThreshold,
      originalThreshold: similarityThreshold 
    });

    // Generate embedding for the enhanced search query
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

    // Perform semantic search using simplified function
    console.log('Performing semantic search...');
    
    // Try primary search first
    console.log('Calling semantic_search_products with:', {
      search_query: query,
      similarity_threshold: primaryThreshold,
      match_count: matchCount
    });

    let { data: searchResults, error: searchError } = await supabase
      .rpc('semantic_search_products', {
        query_embedding: queryEmbedding,
        search_query: query,
        similarity_threshold: primaryThreshold,
        match_count: matchCount
      });

    // Fallback mechanism if not enough results
    if (!searchError && (!searchResults || searchResults.length < 3) && brand) {
      console.log('Primary search returned few results, trying fallback with lower threshold...');
      
      const { data: fallbackResults, error: fallbackError } = await supabase
        .rpc('semantic_search_products', {
          query_embedding: queryEmbedding,
          search_query: query,
          similarity_threshold: fallbackThreshold,
          match_count: matchCount
        });
      
      if (!fallbackError && fallbackResults) {
        searchResults = fallbackResults;
        searchError = fallbackError;
        console.log(`Fallback search found ${fallbackResults.length} results`);
      }
    }

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
    
    // Apply post-processing filtering with brand/model recognition
    const filteredResults = searchResults ? applyPostProcessingFilter(searchResults, query) : [];
    
    console.log(`After post-processing filtering: ${filteredResults.length} matches`);
    
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
      error: (error as Error).message || 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});