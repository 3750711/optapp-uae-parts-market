import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createServiceClient } from '../_shared/client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrichmentRequest {
  product_id: string;
  title: string;
  brand?: string;
  model?: string;
  description?: string;
}

interface EnrichmentResponse {
  title_ru: string;
  brand: string | null;
  model: string | null;
  confidence: number;
  processing_time_ms?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();
    const supabase = createServiceClient();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not found');
    }

    const { product_id, title, brand, model, description, auto_trigger = false }: EnrichmentRequest & { auto_trigger?: boolean } = await req.json();

    console.log(`🤖 AI enrichment started for product ${product_id}: "${title}" (auto: ${auto_trigger})`);

    // Получаем список брендов и моделей для контекста
    const { data: brands } = await supabase
      .from('car_brands')
      .select('name')
      .order('name');
      
    const { data: models } = await supabase
      .from('car_models')  
      .select('name, brand_id, car_brands(name)')
      .order('name');

    const brandsList = brands?.map(b => b.name).join(', ') || '';
    const modelsContext = models?.map(m => `${m.car_brands?.name} ${m.name}`).slice(0, 50).join(', ') || '';

    // Упрощенный промпт для OpenAI
    const prompt = `Исправь ошибки и определи марку/модель автомобиля.

Частые ошибки: engene->engine, bamper->bumper, transmision->transmission

Товар: "${title}"

Доступные марки: ${brandsList}

Ответь в JSON:
{
  "title_ru": "название на русском",
  "brand": "марка из списка или null", 
  "model": "модель или null",
  "confidence": 0.0-1.0
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: prompt }
        ],
        response_format: { 
          type: "json_schema",
          json_schema: {
            name: "product_enrichment",
            schema: {
              type: "object",
              properties: {
                title_ru: { type: "string" },
                brand: { type: ["string", "null"] },
                model: { type: ["string", "null"] },
                confidence: { type: "number", minimum: 0, maximum: 1 }
              },
              required: ["title_ru", "confidence"]
            }
          }
        },
        temperature: 0.3,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const completion = await response.json();
    const result: EnrichmentResponse = JSON.parse(completion.choices[0].message.content);
    
    const processingTime = Date.now() - startTime;
    result.processing_time_ms = processingTime;

    console.log(`✅ AI enrichment completed in ${processingTime}ms with confidence: ${result.confidence}`);

    // ВСЕГДА обновляем товар независимо от confidence
    console.log(`🔄 Auto-updating product (confidence: ${result.confidence})`);
    
    const updateData: any = {
      ai_confidence: result.confidence,
      ai_enriched_at: new Date().toISOString(),
      ai_original_title: title,
      requires_moderation: result.confidence < 0.9
    };

    // Обновляем данные, если AI предоставил их
    if (result.title_ru && result.title_ru !== title) {
      updateData.title = result.title_ru;
    }
    if (result.brand && result.brand !== brand) {
      updateData.brand = result.brand;
    }
    if (result.model && result.model !== model) {
      updateData.model = result.model;
    }

    await supabase
      .from('products')
      .update(updateData)
      .eq('id', product_id);
    
    // Сохраняем лог обработки
    await supabase
      .from('ai_enrichment_logs')
      .insert({
        product_id,
        input_data: { title, brand, model, description },
        ai_response: result,
        confidence: result.confidence,
        processing_time_ms: processingTime
      });

    console.log('📝 AI enrichment log saved');
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('❌ Error in ai-enrich-product:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'AI enrichment failed' 
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});