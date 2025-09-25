import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateSynonymsRequest {
  term: string;
  category?: 'brand' | 'model' | 'part' | 'general';
  language?: 'ru' | 'en';
}

serve(async (req) => {
  console.log('Generate synonyms function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { term, category = 'general', language = 'ru' }: GenerateSynonymsRequest = await req.json();

    if (!term || term.trim().length === 0) {
      throw new Error('Term is required');
    }

    console.log(`Generating synonyms for term: "${term}", category: ${category}, language: ${language}`);

    // Create AI prompt based on category and language
    let prompt = '';
    if (language === 'ru') {
      switch (category) {
        case 'brand':
          prompt = `Создай список синонимов для автомобильного бренда "${term}". Включи:
- Альтернативные написания на русском и английском
- Сленговые названия
- Популярные сокращения
Верни только список слов через запятую, без объяснений.`;
          break;
        case 'part':
          prompt = `Создай список синонимов для автозапчасти "${term}". Включи:
- Альтернативные названия на русском
- Английские эквиваленты
- Сленговые термины
- Профессиональные термины
Верни только список слов через запятую, без объяснений.`;
          break;
        case 'model':
          prompt = `Создай список синонимов для модели автомобиля "${term}". Включи:
- Альтернативные написания
- Популярные сокращения
- Вариации названия
Верни только список слов через запятую, без объяснений.`;
          break;
        default:
          prompt = `Создай список синонимов для термина "${term}" в контексте автомобилей и автозапчастей. Верни только список слов через запятую, без объяснений.`;
      }
    } else {
      switch (category) {
        case 'brand':
          prompt = `Create synonyms for the car brand "${term}". Include:
- Alternative spellings in English and Russian
- Slang names
- Popular abbreviations
Return only a comma-separated list of words, no explanations.`;
          break;
        case 'part':
          prompt = `Create synonyms for the car part "${term}". Include:
- Alternative names in English
- Russian equivalents
- Slang terms
- Professional terms
Return only a comma-separated list of words, no explanations.`;
          break;
        case 'model':
          prompt = `Create synonyms for the car model "${term}". Include:
- Alternative spellings
- Popular abbreviations
- Name variations
Return only a comma-separated list of words, no explanations.`;
          break;
        default:
          prompt = `Create synonyms for the term "${term}" in the context of cars and auto parts. Return only a comma-separated list of words, no explanations.`;
      }
    }

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in automotive terminology. Generate relevant synonyms that would help improve search functionality.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      const error = await openAIResponse.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${openAIResponse.status}`);
    }

    const openAIData = await openAIResponse.json();
    const synonymsText = openAIData.choices[0]?.message?.content?.trim();

    if (!synonymsText) {
      throw new Error('No synonyms generated');
    }

    console.log('AI generated synonyms:', synonymsText);

    // Parse synonyms from AI response
    const synonyms = synonymsText
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(s => s.length > 0 && s !== term.toLowerCase())
      .slice(0, 10); // Limit to 10 synonyms

    console.log('Parsed synonyms:', synonyms);

    // Insert synonyms into database
    const synonymData = synonyms.map(synonym => ({
      original_term: term.toLowerCase(),
      synonym: synonym,
      category,
      language,
    }));

    // Also add reverse synonyms (synonym -> original term)
    const reverseData = synonyms.map(synonym => ({
      original_term: synonym,
      synonym: term.toLowerCase(),
      category,
      language,
    }));

    const allData = [...synonymData, ...reverseData];

    // Insert with conflict handling (ignore duplicates)
    const { data: insertedData, error: insertError } = await supabase
      .from('search_synonyms')
      .upsert(allData, { 
        onConflict: 'original_term, synonym, language',
        ignoreDuplicates: true 
      })
      .select();

    if (insertError) {
      console.error('Error inserting synonyms:', insertError);
      throw new Error(`Database error: ${insertError.message}`);
    }

    console.log(`Successfully inserted ${insertedData?.length || 0} synonym records`);

    return new Response(
      JSON.stringify({
        success: true,
        term,
        category,
        language,
        synonyms,
        inserted: insertedData?.length || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-synonyms function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});