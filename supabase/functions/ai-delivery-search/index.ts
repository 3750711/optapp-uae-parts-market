import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createServiceClient } from '../_shared/client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchRequest {
  title: string;
  brand?: string;
  model?: string;
  category?: string;
}

interface SearchMatch {
  product_id: string;
  title: string;
  delivery_price: number;
  confidence: number;
  match_type: 'exact_engine_code' | 'exact_part_model' | 'fuzzy_match' | 'category_match';
  reasoning: string;
}

interface SearchResponse {
  matches: SearchMatch[];
  total_found: number;
  search_time_ms: number;
  categories_analyzed: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = performance.now();
  
  try {
    const supabase = createServiceClient();
    const { title, brand, model, category }: SearchRequest = await req.json();
    
    console.log(`🔍 AI Delivery Search started for: "${title}"`);
    
    const matches: SearchMatch[] = [];
    const categoriesAnalyzed: string[] = [];
    
    // Нормализуем входные данные
    const normalizedTitle = title.toLowerCase().trim();
    const normalizedBrand = brand?.toLowerCase().trim();
    const normalizedModel = model?.toLowerCase().trim();
    
    // 1. УРОВЕНЬ 1: Поиск точного кода двигателя (1ZZ, 2AZ, K20A)
    const engineCodes = extractEngineCodes(normalizedTitle);
    if (engineCodes.length > 0) {
      console.log(`🔧 Found engine codes: ${engineCodes.join(', ')}`);
      categoriesAnalyzed.push('engines');
      
      for (const code of engineCodes) {
        const { data: engineMatches } = await supabase
          .from('products')
          .select('id, title, delivery_price')
          .ilike('title', `%${code}%`)
          .not('delivery_price', 'is', null)
          .gt('delivery_price', 0)
          .limit(20);
        
        if (engineMatches) {
          for (const match of engineMatches) {
            // Проверяем, что это действительно код двигателя, а не случайное совпадение
            if (isValidEngineMatch(match.title.toLowerCase(), code)) {
              matches.push({
                product_id: match.id,
                title: match.title,
                delivery_price: match.delivery_price,
                confidence: 0.95,
                match_type: 'exact_engine_code',
                reasoning: `Exact engine code match: ${code}`
              });
            }
          }
        }
      }
    }
    
    // 2. УРОВЕНЬ 2: Поиск по типу детали + марка/модель
    const partType = extractPartType(normalizedTitle);
    if (partType && (normalizedBrand || normalizedModel)) {
      console.log(`🔧 Found part type: ${partType}, brand: ${normalizedBrand}, model: ${normalizedModel}`);
      categoriesAnalyzed.push('body_parts');
      
      let query = supabase
        .from('products')
        .select('id, title, delivery_price')
        .ilike('title', `%${partType}%`)
        .not('delivery_price', 'is', null)
        .gt('delivery_price', 0);
      
      if (normalizedBrand) {
        query = query.ilike('title', `%${normalizedBrand}%`);
      }
      
      if (normalizedModel) {
        query = query.ilike('title', `%${normalizedModel}%`);
      }
      
      const { data: partMatches } = await query.limit(15);
      
      if (partMatches) {
        for (const match of partMatches) {
          const confidence = calculatePartMatchConfidence(
            match.title.toLowerCase(), 
            partType, 
            normalizedBrand, 
            normalizedModel
          );
          
          if (confidence > 0.6) {
            matches.push({
              product_id: match.id,
              title: match.title,
              delivery_price: match.delivery_price,
              confidence,
              match_type: 'exact_part_model',
              reasoning: `Part + model match: ${partType} ${normalizedBrand || ''} ${normalizedModel || ''}`.trim()
            });
          }
        }
      }
    }
    
    // 3. УРОВЕНЬ 3: Fuzzy поиск по категории если мало точных совпадений
    if (matches.length < 5) {
      console.log(`🔍 Running fuzzy search, current matches: ${matches.length}`);
      categoriesAnalyzed.push('fuzzy_search');
      
      const fuzzyTerms = extractSearchTerms(normalizedTitle);
      for (const term of fuzzyTerms) {
        if (term.length >= 3) {
          const { data: fuzzyMatches } = await supabase
            .from('products')
            .select('id, title, delivery_price')
            .ilike('title', `%${term}%`)
            .not('delivery_price', 'is', null)
            .gt('delivery_price', 0)
            .limit(10);
          
          if (fuzzyMatches) {
            for (const match of fuzzyMatches) {
              const confidence = calculateFuzzyConfidence(match.title.toLowerCase(), normalizedTitle);
              
              if (confidence > 0.4 && !matches.find(m => m.product_id === match.id)) {
                matches.push({
                  product_id: match.id,
                  title: match.title,
                  delivery_price: match.delivery_price,
                  confidence,
                  match_type: 'fuzzy_match',
                  reasoning: `Fuzzy match on term: ${term}`
                });
              }
            }
          }
        }
      }
    }
    
    // 4. УРОВЕНЬ 4: Категорийный поиск если всё ещё мало совпадений
    if (matches.length < 3 && partType) {
      console.log(`🔍 Running category search for part type: ${partType}`);
      categoriesAnalyzed.push('category_fallback');
      
      const { data: categoryMatches } = await supabase
        .from('products')
        .select('id, title, delivery_price')
        .ilike('title', `%${partType}%`)
        .not('delivery_price', 'is', null)
        .gt('delivery_price', 0)
        .limit(20);
      
      if (categoryMatches) {
        for (const match of categoryMatches) {
          if (!matches.find(m => m.product_id === match.id)) {
            matches.push({
              product_id: match.id,
              title: match.title,
              delivery_price: match.delivery_price,
              confidence: 0.3,
              match_type: 'category_match',
              reasoning: `Category fallback for: ${partType}`
            });
          }
        }
      }
    }
    
    // Сортируем по уверенности
    matches.sort((a, b) => b.confidence - a.confidence);
    
    const searchTimeMs = Math.round(performance.now() - startTime);
    console.log(`✅ Search completed in ${searchTimeMs}ms, found ${matches.length} matches`);
    
    const response: SearchResponse = {
      matches: matches.slice(0, 25), // Ограничиваем результат
      total_found: matches.length,
      search_time_ms: searchTimeMs,
      categories_analyzed: categoriesAnalyzed
    };
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('❌ Error in ai-delivery-search:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        matches: [],
        total_found: 0,
        search_time_ms: Math.round(performance.now() - startTime)
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Вспомогательные функции для анализа

function extractEngineCodes(title: string): string[] {
  // Паттерны кодов двигателей
  const enginePatterns = [
    /\b([12][a-z]{1,2}[-_]?[a-z]{1,3})\b/gi,  // 1ZZ, 2AZ-FE, 1JZ-GTE
    /\b([a-z]\d{2}[a-z]?\d?)\b/gi,            // K20A, SR20, F20C
    /\b(\d[a-z]{2,4})\b/gi,                   // 3SGE, 4AGE, 1UZ
  ];
  
  const codes: string[] = [];
  for (const pattern of enginePatterns) {
    const matches = title.match(pattern);
    if (matches) {
      codes.push(...matches.map(m => m.toUpperCase()));
    }
  }
  
  return [...new Set(codes)]; // Убираем дубликаты
}

function extractPartType(title: string): string | null {
  const partTypes = {
    'nose cut': ['nose cut', 'noze cut', 'nose-cut', 'ноускат'],
    'hood': ['hood', 'капот'],
    'bumper': ['bumper', 'бампер'],
    'fender': ['fender', 'крыло'],
    'door': ['door', 'дверь'],
    'engine': ['engine', 'двигатель', 'мотор', 'двс']
  };
  
  for (const [type, keywords] of Object.entries(partTypes)) {
    for (const keyword of keywords) {
      if (title.includes(keyword)) {
        return type;
      }
    }
  }
  
  return null;
}

function isValidEngineMatch(matchTitle: string, engineCode: string): boolean {
  // Проверяем, что найденный код действительно является кодом двигателя
  const contextWords = ['engine', 'двигатель', 'мотор', 'двс', 'motor'];
  
  return contextWords.some(word => matchTitle.includes(word)) ||
         matchTitle.includes(engineCode.toLowerCase());
}

function calculatePartMatchConfidence(
  matchTitle: string, 
  partType: string, 
  brand?: string, 
  model?: string
): number {
  let confidence = 0.5; // Базовый уровень за совпадение типа детали
  
  if (brand && matchTitle.includes(brand)) {
    confidence += 0.25;
  }
  
  if (model && matchTitle.includes(model)) {
    confidence += 0.25;
  }
  
  // Бонус за точное совпадение типа детали
  if (matchTitle.includes(partType)) {
    confidence += 0.1;
  }
  
  return Math.min(confidence, 0.9);
}

function calculateFuzzyConfidence(matchTitle: string, originalTitle: string): number {
  const originalWords = originalTitle.split(/\s+/).filter(w => w.length > 2);
  const matchWords = matchTitle.split(/\s+/).filter(w => w.length > 2);
  
  let commonWords = 0;
  for (const word of originalWords) {
    if (matchWords.some(mw => mw.includes(word) || word.includes(mw))) {
      commonWords++;
    }
  }
  
  return Math.min(commonWords / Math.max(originalWords.length, 1) * 0.8, 0.7);
}

function extractSearchTerms(title: string): string[] {
  // Исключаем стоп-слова
  const stopWords = ['the', 'and', 'or', 'for', 'with', 'used', 'new', 'original', 'oem'];
  
  return title
    .split(/[\s\-_.,()]+/)
    .filter(term => term.length >= 3 && !stopWords.includes(term))
    .slice(0, 5); // Ограничиваем количество терминов
}