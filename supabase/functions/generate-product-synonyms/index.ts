import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GenerateProductSynonymsRequest {
  productId: string;
  title: string;
  brand?: string;
  model?: string;
}

const extractKeyTerms = (title: string): string[] => {
  // Common automotive terms that should have synonyms
  const automotiveTerms = [
    'фара', 'бампер', 'двигатель', 'мотор', 'коробка', 'кпп', 'редуктор',
    'радиатор', 'стартер', 'генератор', 'насос', 'фильтр', 'свечи',
    'тормоза', 'колодки', 'диски', 'амортизатор', 'пружина', 'стойка',
    'рулевая', 'рейка', 'наконечник', 'шаровая', 'подшипник', 'сайлентблок',
    'крыло', 'капот', 'дверь', 'крышка', 'стекло', 'зеркало', 'ручка',
    'сиденье', 'руль', 'панель', 'торпеда', 'консоль', 'решетка'
  ];

  const words = title.toLowerCase().split(/\s+/);
  const foundTerms = new Set<string>();
  
  // Find automotive terms in title
  words.forEach(word => {
    automotiveTerms.forEach(term => {
      if (word.includes(term) || term.includes(word)) {
        foundTerms.add(term);
      }
    });
  });

  return Array.from(foundTerms);
};

const generateSynonymsForTerm = async (term: string, category: string = 'automotive'): Promise<string[]> => {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  let prompt = '';
  if (category === 'brand') {
    prompt = `Создай 3-5 синонимов и альтернативных названий для автомобильной марки "${term}". Включи:
- Сокращения и аббревиатуры
- Альтернативные написания
- Популярные прозвища
- Переводы на английский

Верни только синонимы через запятую, без объяснений.`;
  } else if (category === 'model') {
    prompt = `Создай 3-5 синонимов для модели автомобиля "${term}". Включи:
- Альтернативные написания (кириллица/латиница)
- Сокращения
- Популярные названия
- Переводы

Верни только синонимы через запятую, без объяснений.`;
  } else {
    prompt = `Создай 5-7 синонимов для автозапчасти "${term}". Включи:
- Технические термины
- Жаргонные названия
- Альтернативные варианты
- Переводы на английский
- Сокращения

Верни только синонимы через запятую, без объяснений.`;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Ты эксперт по автомобильной терминологии. Создавай точные и полезные синонимы.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 200,
        temperature: 0.3
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`);
    }

    const synonymsText = data.choices[0]?.message?.content?.trim() || '';
    console.log(`Generated synonyms for "${term}":`, synonymsText);

    // Parse and clean synonyms
    const synonyms = synonymsText
      .split(/[,;]/)
      .map((s: string) => s.trim())
      .filter((s: string) => s && s.length > 1 && s !== term)
      .slice(0, 7); // Limit to 7 synonyms per term

    return synonyms;
  } catch (error) {
    console.error(`Error generating synonyms for "${term}":`, error);
    return [];
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { productId, title, brand, model }: GenerateProductSynonymsRequest = await req.json();
    
    console.log(`Generating synonyms for product ${productId}: "${title}"`);

    const allTermsToProcess = new Set<string>();
    const synonymResults = [];

    // Add brand if provided
    if (brand && brand.trim()) {
      allTermsToProcess.add(brand.trim());
    }

    // Add model if provided
    if (model && model.trim()) {
      allTermsToProcess.add(model.trim());
    }

    // Extract automotive terms from title
    const automotiveTerms = extractKeyTerms(title);
    automotiveTerms.forEach(term => allTermsToProcess.add(term));

    console.log(`Found ${allTermsToProcess.size} terms to process:`, Array.from(allTermsToProcess));

    // Check existing synonyms to avoid duplicates
    const { data: existingSynonyms } = await supabaseClient
      .from('search_synonyms')
      .select('original_term, synonym')
      .in('original_term', Array.from(allTermsToProcess));

    const existingMap = new Map<string, Set<string>>();
    existingSynonyms?.forEach(item => {
      if (!existingMap.has(item.original_term)) {
        existingMap.set(item.original_term, new Set());
      }
      existingMap.get(item.original_term)?.add(item.synonym.toLowerCase());
    });

    // Generate synonyms for each term
    for (const term of allTermsToProcess) {
      try {
        let category = 'automotive';
        if (brand && term === brand) category = 'brand';
        else if (model && term === model) category = 'model';

        const generatedSynonyms = await generateSynonymsForTerm(term, category);
        const existingForTerm = existingMap.get(term) || new Set();

        // Filter out existing synonyms
        const newSynonyms = generatedSynonyms.filter(syn => 
          !existingForTerm.has(syn.toLowerCase()) && syn.toLowerCase() !== term.toLowerCase()
        );

        if (newSynonyms.length > 0) {
          // Prepare synonym records for batch insert
          const synonymRecords: Array<{term: string; synonym: string; source: string; original_term?: string; language?: string; category?: string}> = [];
          
          // Forward synonyms (original -> synonym)
          newSynonyms.forEach(synonym => {
            synonymRecords.push({
              term: term,
              synonym: synonym,
              source: 'ai_generated',
              original_term: term,
              language: 'ru',
              category: category
            });
          });

          // Reverse synonyms (synonym -> original) for better search coverage
          newSynonyms.forEach(synonym => {
            synonymRecords.push({
              term: synonym,
              synonym: term,
              source: 'ai_generated',
              original_term: synonym,
              language: 'ru',
              category: category
            });
          });

          // Insert synonyms
          const { error: insertError } = await supabaseClient
            .from('search_synonyms')
            .upsert(synonymRecords, { 
              onConflict: 'original_term, synonym, language',
              ignoreDuplicates: true 
            });

          if (insertError) {
            console.error(`Error inserting synonyms for "${term}":`, insertError);
          } else {
            console.log(`Successfully inserted ${synonymRecords.length} synonym records for "${term}"`);
            synonymResults.push({
              term,
              category,
              synonyms: newSynonyms,
              recordsInserted: synonymRecords.length
            });
          }
        } else {
          console.log(`No new synonyms to add for "${term}" (all already exist)`);
        }

        // Small delay to avoid overwhelming OpenAI API
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Error processing term "${term}":`, error);
      }
    }

    const totalRecordsInserted = synonymResults.reduce((sum, result) => sum + result.recordsInserted, 0);

    console.log(`Synonym generation completed for product ${productId}. Total records inserted: ${totalRecordsInserted}`);

    return new Response(JSON.stringify({
      success: true,
      productId,
      termsProcessed: allTermsToProcess.size,
      synonymResults,
      totalRecordsInserted
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-product-synonyms function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});