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
  original_title: string;
  corrected_title_en: string;
  corrected_title_ru: string;
  brand: string;
  model: string;
  category: string;
  confidence: number;
  corrections: Array<{
    from: string;
    to: string;
    reason: string;
  }>;
  processing_time_ms: number;
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

    const { product_id, title, brand, model, description }: EnrichmentRequest = await req.json();

    console.log(`🤖 AI enrichment started for product ${product_id}: "${title}"`);

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

    // Структурированный запрос к GPT-4
    const systemPrompt = `Ты эксперт по автозапчастям и исправлению текстов. Твоя задача:

1. Исправить опечатки в названии товара
2. Определить марку и модель автомобиля из справочника
3. Перевести название на русский язык
4. Оценить уверенность в исправлениях (0.0-1.0)

Доступные марки: ${brandsList}

Примеры частых ошибок:
- engene → engine (двигатель)
- bamper → bumper (бампер) 
- transmision → transmission (трансмиссия)
- brakes → тормоза
- suspension → подвеска
- headlight → фара

ВАЖНО: Если марка/модель не определяется точно, оставь пустыми поля brand и model.
Confidence должен быть высоким (>0.8) только при уверенных исправлениях.`;

    const userPrompt = `Товар: "${title}"
${brand ? `Текущая марка: ${brand}` : ''}
${model ? `Текущая модель: ${model}` : ''}
${description ? `Описание: ${description}` : ''}

Исправь название, определи марку и модель, переведи на русский.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { 
          type: "json_schema",
          json_schema: {
            name: "product_enrichment",
            schema: {
              type: "object",
              properties: {
                original_title: { type: "string" },
                corrected_title_en: { type: "string" },
                corrected_title_ru: { type: "string" },
                brand: { type: "string" },
                model: { type: "string" },
                category: { type: "string" },
                confidence: { type: "number", minimum: 0, maximum: 1 },
                corrections: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      from: { type: "string" },
                      to: { type: "string" },
                      reason: { type: "string" }
                    },
                    required: ["from", "to", "reason"]
                  }
                }
              },
              required: ["original_title", "corrected_title_en", "corrected_title_ru", "confidence", "corrections"]
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

    // Автоматически обновляем товар если confidence > 70%
    if (result.confidence > 0.7) {
      console.log('🔄 Auto-updating product with high confidence results');
      
      const updateData: any = {
        ai_confidence: result.confidence,
        ai_enriched_at: new Date().toISOString(),
        ai_original_title: title,
        requires_moderation: result.confidence < 0.9
      };

      // Обновляем только если есть улучшения
      if (result.corrected_title_ru && result.corrected_title_ru !== title) {
        updateData.title = result.corrected_title_ru;
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
    }
    
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