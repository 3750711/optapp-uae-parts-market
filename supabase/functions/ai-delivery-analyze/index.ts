import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient } from '../_shared/client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyzeRequest {
  title: string;
  brand?: string;
  model?: string;
  original_title: string;
  product_id?: string;
}

interface SearchMatch {
  product_id: string;
  title: string;
  delivery_price: number;
  confidence: number;
  match_type: string;
  reasoning: string;
}

interface PriceRecommendation {
  price: number;
  confidence: number;
  count: number;
  percentage: number;
}

interface AnalyzeResponse {
  success: boolean;
  recommendations: PriceRecommendation[];
  reasoning: {
    matches_found: number;
    search_queries: string[];
    price_distribution: Record<string, number>;
    top_confidence: number;
    logic_type: string;
    similar_products: Array<{id: string, title: string, price: number}>;
    execution_time_ms: number;
    analysis_summary: string;
  };
  suggested_prices: number[];
  confidence_level: 'high' | 'medium' | 'low';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = performance.now();
  
  try {
    const supabase = createServiceClient();
    const { title, brand, model, original_title, product_id }: AnalyzeRequest = await req.json();
    
    console.log(`🧠 AI Delivery Analysis started for: "${title}"`);
    
    // 1. Получаем совпадения от функции поиска
    const { data: searchResult, error: searchError } = await supabase.functions.invoke(
      'ai-delivery-search',
      {
        body: { title, brand, model }
      }
    );
    
    if (searchError) {
      throw new Error(`Search function error: ${searchError.message}`);
    }
    
    const matches: SearchMatch[] = searchResult?.matches || [];
    console.log(`📊 Found ${matches.length} matches for analysis`);
    
    if (matches.length === 0) {
      return createEmptyResponse(startTime, 'No matches found for delivery analysis');
    }
    
    // 2. Анализируем распределение цен
    const priceDistribution = analyzePriceDistribution(matches);
    const recommendations = generateRecommendations(priceDistribution, matches);
    const confidenceLevel = calculateOverallConfidence(matches, priceDistribution);
    
    // 3. Определяем логику и создаём обоснование
    const logicType = determineLogicType(matches);
    const topConfidence = Math.max(...matches.map((m: SearchMatch) => m.confidence));
    
    // 4. Формируем итоговые рекомендации
    const suggestedPrices = extractSuggestedPrices(recommendations, confidenceLevel);
    const analysisSummary = generateAnalysisSummary(matches, recommendations, confidenceLevel);
    
    // 5. Сохраняем результат в базу (если указан product_id)
    if (product_id) {
      console.log(`💾 Saving analysis results for product ${product_id}`);
      
      const { error: updateError } = await supabase
        .from('products')
        .update({
          ai_suggested_delivery_prices: suggestedPrices,
          ai_delivery_confidence: topConfidence,
          ai_delivery_reasoning: {
            matches_found: matches.length,
            search_queries: [title, brand, model].filter((item): item is string => Boolean(item)),
            price_distribution: priceDistribution,
            top_confidence: topConfidence,
            logic_type: logicType,
            similar_products: matches.slice(0, 5).map((m: SearchMatch) => ({
              id: m.product_id,
              title: m.title,
              price: m.delivery_price
            })),
            execution_time_ms: Math.round(performance.now() - startTime),
            analysis_summary: analysisSummary,
            recommendations: recommendations
          }
        })
        .eq('id', product_id);
      
      if (updateError) {
        console.error('❌ Error saving analysis to product:', updateError);
      } else {
        console.log('✅ Analysis results saved successfully');
      }
    }
    
    const executionTime = Math.round(performance.now() - startTime);
    console.log(`✅ Analysis completed in ${executionTime}ms`);
    
    const response: AnalyzeResponse = {
      success: true,
      recommendations,
      reasoning: {
        matches_found: matches.length,
        search_queries: [title, brand, model].filter((item): item is string => Boolean(item)),
        price_distribution: priceDistribution,
        top_confidence: topConfidence,
        logic_type: logicType,
        similar_products: matches.slice(0, 5).map((m: SearchMatch) => ({
          id: m.product_id,
          title: m.title,
          price: m.delivery_price
        })),
        execution_time_ms: executionTime,
        analysis_summary: analysisSummary
      },
      suggested_prices: suggestedPrices,
      confidence_level: confidenceLevel
    };
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('❌ Error in ai-delivery-analyze:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        recommendations: [],
        suggested_prices: [],
        confidence_level: 'low' as const
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function analyzePriceDistribution(matches: SearchMatch[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  
  for (const match of matches) {
    const price = String(match.delivery_price);
    distribution[price] = (distribution[price] || 0) + 1;
  }
  
  return distribution;
}

function generateRecommendations(
  priceDistribution: Record<string, number>, 
  matches: SearchMatch[]
): PriceRecommendation[] {
  const totalMatches = matches.length;
  const recommendations: PriceRecommendation[] = [];
  
  // Сортируем цены по количеству совпадений
  const sortedPrices = Object.entries(priceDistribution)
    .map(([price, count]) => ({
      price: Number(price),
      count,
      percentage: (count / totalMatches) * 100
    }))
    .sort((a, b) => b.count - a.count);
  
  // Добавляем рекомендации на основе статистики
  for (const entry of sortedPrices.slice(0, 3)) { // Топ 3 цены
    const confidence = calculatePriceConfidence(entry, totalMatches, matches);
    
    recommendations.push({
      price: entry.price,
      confidence,
      count: entry.count,
      percentage: entry.percentage
    });
  }
  
  return recommendations;
}

function calculatePriceConfidence(
  entry: { price: number; count: number; percentage: number },
  totalMatches: number,
  matches: SearchMatch[]
): number {
  let confidence = 0.3; // Базовый уровень
  
  // Бонус за количество совпадений
  if (entry.count >= 10) confidence += 0.4;
  else if (entry.count >= 5) confidence += 0.3;
  else if (entry.count >= 3) confidence += 0.2;
  else confidence += 0.1;
  
  // Бонус за процент от общего количества
  if (entry.percentage >= 80) confidence += 0.3;
  else if (entry.percentage >= 60) confidence += 0.2;
  else if (entry.percentage >= 40) confidence += 0.1;
  
  // Бонус за высокую уверенность в совпадениях
  const avgMatchConfidence = matches
    .filter(m => m.delivery_price === entry.price)
    .reduce((sum, m) => sum + m.confidence, 0) / entry.count;
  
  if (avgMatchConfidence >= 0.8) confidence += 0.1;
  
  return Math.min(confidence, 0.95);
}

function calculateOverallConfidence(
  matches: SearchMatch[], 
  priceDistribution: Record<string, number>
): 'high' | 'medium' | 'low' {
  const totalMatches = matches.length;
  const maxCount = Math.max(...Object.values(priceDistribution));
  const maxPercentage = (maxCount / totalMatches) * 100;
  const avgMatchConfidence = matches.reduce((sum, m) => sum + m.confidence, 0) / totalMatches;
  
  // Высокая уверенность
  if (
    totalMatches >= 10 && 
    maxPercentage >= 70 && 
    avgMatchConfidence >= 0.7
  ) {
    return 'high';
  }
  
  // Средняя уверенность
  if (
    totalMatches >= 5 && 
    maxPercentage >= 50 && 
    avgMatchConfidence >= 0.5
  ) {
    return 'medium';
  }
  
  return 'low';
}

function determineLogicType(matches: SearchMatch[]): string {
  const matchTypes = matches.map(m => m.match_type);
  
  if (matchTypes.includes('exact_engine_code')) {
    return 'engine_code_exact';
  } else if (matchTypes.includes('exact_part_model')) {
    return 'part_model_exact';
  } else if (matchTypes.includes('fuzzy_match')) {
    return 'fuzzy_similarity';
  } else if (matchTypes.includes('category_match')) {
    return 'category_fallback';
  }
  
  return 'mixed_analysis';
}

function extractSuggestedPrices(
  recommendations: PriceRecommendation[], 
  confidenceLevel: string
): number[] {
  if (confidenceLevel === 'high') {
    // При высокой уверенности рекомендуем только топ цену
    return [recommendations[0]?.price].filter(Boolean);
  } else if (confidenceLevel === 'medium') {
    // При средней уверенности рекомендуем топ 2 цены
    return recommendations.slice(0, 2).map(r => r.price);
  } else {
    // При низкой уверенности рекомендуем диапазон
    return recommendations.slice(0, 3).map(r => r.price);
  }
}

function generateAnalysisSummary(
  matches: SearchMatch[], 
  recommendations: PriceRecommendation[], 
  confidenceLevel: string
): string {
  const totalMatches = matches.length;
  const topRecommendation = recommendations[0];
  
  if (!topRecommendation) {
    return 'Insufficient data for analysis';
  }
  
  const matchTypes = [...new Set(matches.map(m => m.match_type))];
  
  let summary = `Found ${totalMatches} similar products. `;
  
  if (confidenceLevel === 'high') {
    summary += `High confidence recommendation: $${topRecommendation.price} (${topRecommendation.count} matches, ${topRecommendation.percentage.toFixed(1)}% of total). `;
  } else if (confidenceLevel === 'medium') {
    summary += `Medium confidence with ${recommendations.length} price options. Top choice: $${topRecommendation.price} (${topRecommendation.count} matches). `;
  } else {
    summary += `Low confidence analysis. Price range: $${Math.min(...recommendations.map(r => r.price))} - $${Math.max(...recommendations.map(r => r.price))}. `;
  }
  
  summary += `Match types: ${matchTypes.join(', ')}.`;
  
  return summary;
}

function createEmptyResponse(startTime: number, message: string): Response {
  return new Response(
    JSON.stringify({
      success: false,
      recommendations: [],
      reasoning: {
        matches_found: 0,
        search_queries: [],
        price_distribution: {},
        top_confidence: 0,
        logic_type: 'no_matches',
        similar_products: [],
        execution_time_ms: Math.round(performance.now() - startTime),
        analysis_summary: message
      },
      suggested_prices: [],
      confidence_level: 'low' as const
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}