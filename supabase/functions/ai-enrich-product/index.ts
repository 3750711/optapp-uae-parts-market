import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createServiceClient } from '../_shared/client.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ШАГ 0: Глобальная функция для анализа различий и извлечения новых правил
async function extractNewRules(aiSuggestion: string, moderatorCorrection: string, productId: string) {
  try {
    console.log(`🔍 Analyzing differences for product ${productId}`);
    console.log(`🎯 AI: "${aiSuggestion}" → Moderator: "${moderatorCorrection}"`);
    
    const supabase = createServiceClient();
    
    // Используем функцию из базы данных для извлечения правил
    const { data: extractedRules, error: rpcError } = await supabase.rpc('extract_translation_rules', {
      p_ai_suggestion: aiSuggestion,
      p_moderator_correction: moderatorCorrection
    });

    if (rpcError) {
      console.error('❌ RPC error extracting rules:', rpcError);
      return { error: rpcError };
    }

    if (extractedRules && Array.isArray(extractedRules) && extractedRules.length > 0) {
      console.log(`📝 Found ${extractedRules.length} potential new rules`);
      
      // Сохраняем анализ в таблицу
      const { error: analysisError } = await supabase
        .from('ai_correction_analysis')
        .insert({
          product_id: productId,
          ai_suggestion: aiSuggestion,
          moderator_correction: moderatorCorrection,
          extracted_rules: extractedRules,
          differences: extractedRules, // Добавляем для совместимости
          moderator_id: null // Будет заполнено позже
        });

      if (analysisError) {
        console.warn('⚠️ Failed to save analysis:', analysisError);
      }

      // Добавляем или обновляем правила перевода
      for (const rule of extractedRules) {
        try {
          const { data: existingRule, error: selectError } = await supabase
            .from('ai_translation_rules')
            .select('id, usage_count')
            .eq('original_phrase', rule.from)
            .eq('corrected_phrase', rule.to)
            .maybeSingle();

          if (selectError) {
            console.warn('⚠️ Error checking existing rule:', selectError);
            continue;
          }

          if (existingRule) {
            // Обновляем существующее правило
            const { error: updateError } = await supabase
              .from('ai_translation_rules')
              .update({
                usage_count: existingRule.usage_count + 1,
                last_used_at: new Date().toISOString(),
                confidence_score: Math.min(0.99, existingRule.usage_count * 0.1 + 0.5)
              })
              .eq('id', existingRule.id);
              
            if (updateError) {
              console.warn('⚠️ Failed to update rule:', updateError);
            } else {
              console.log(`🔄 Updated existing rule: "${rule.from}" → "${rule.to}"`);
            }
          } else {
            // Создаем новое правило
            const { error: insertError } = await supabase
              .from('ai_translation_rules')
              .insert({
                original_phrase: rule.from,
                corrected_phrase: rule.to,
                rule_type: rule.type || 'translation',
                confidence_score: rule.confidence || 0.8,
                usage_count: 1,
                created_by: null,
                last_used_at: new Date().toISOString()
              });
              
            if (insertError) {
              console.warn('⚠️ Failed to create rule:', insertError);
            } else {
              console.log(`✅ Created new rule: "${rule.from}" → "${rule.to}"`);
            }
          }
        } catch (ruleError) {
          console.warn('⚠️ Error processing rule:', rule, ruleError);
        }
      }
      
      return { error: null };
    } else {
      console.log('📝 No translation rules extracted');
      return { error: null };
    }
  } catch (error) {
    console.error('❌ Error extracting translation rules:', error);
    return { error };
  }
}

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

    const { 
      product_id, 
      title, 
      brand, 
      model, 
      description, 
      auto_trigger = false,
      extract_rules_only = false,
      ai_suggestion,
      moderator_correction
    }: EnrichmentRequest & { 
      auto_trigger?: boolean,
      extract_rules_only?: boolean,
      ai_suggestion?: string,
      moderator_correction?: string
    } = await req.json();

    // ШАГ 3: Специальный режим только для извлечения правил
    if (extract_rules_only && ai_suggestion && moderator_correction && product_id) {
      console.log(`🎯 Extract rules only mode for product ${product_id}`);
      console.log(`AI: "${ai_suggestion}" → Moderator: "${moderator_correction}"`);
      
      try {
        const { error: rulesError } = await extractNewRules(
          ai_suggestion,
          moderator_correction,
          product_id
        );
        
        if (rulesError) {
          console.error('❌ Failed to extract rules:', rulesError);
          return new Response(JSON.stringify({ 
            success: false, 
            error: rulesError.message 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        console.log('✅ Rules extraction completed');
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Rules extracted successfully' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        console.error('❌ Rules extraction failed:', error);
        return new Response(JSON.stringify({ 
          success: false, 
          error: 'Rules extraction failed' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    console.log(`🤖 AI enrichment started for product ${product_id}: "${title}" (auto: ${auto_trigger})`);

    // Функция для получения последних правок модераторов для обучения
    const getRecentCorrections = async (limit = 20) => {
      const { data } = await supabase
        .from('ai_moderation_corrections')
        .select('ai_original_title, moderator_corrected_title, moderator_corrected_brand, moderator_corrected_model')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (!data || data.length === 0) return '';
      
      return `
Учись на последних правках модератора:
${data.map(d => `"${d.ai_original_title}" → "${d.moderator_corrected_title}"`).join('\n')}
`;
    };

    // Получаем список брендов и моделей для контекста
    const { data: brands } = await supabase
      .from('car_brands')
      .select('name')
      .order('name');
      
    const { data: models } = await supabase
      .from('car_models')  
      .select('name, brand_id, car_brands(name)')
      .order('name');

    // Получаем правила перевода для улучшенного обучения
    console.log('🎯 Loading AI translation rules...');
    const { data: translationRules } = await supabase
      .from('ai_translation_rules')
      .select('original_phrase, corrected_phrase, usage_count, confidence_score, rule_type')
      .eq('is_active', true)
      .order('usage_count', { ascending: false })
      .limit(50);

    const hasRules = translationRules && translationRules.length > 0;
    console.log(`🎯 Translation rules loaded: ${hasRules ? translationRules.length : 0} rules`);

    // Формируем контекст правил перевода для промта
    const translationRulesContext = hasRules ? `
ПРАВИЛА ОБУЧЕНИЯ (из исправлений модераторов):
${translationRules.map(rule => 
  `- "${rule.original_phrase}" → "${rule.corrected_phrase}" (использовано: ${rule.usage_count} раз, уверенность: ${rule.confidence_score})`
).join('\n')}

ПРИМЕНЯЙ ЭТИ ПРАВИЛА при обработке:
` : '';

    // Группируем модели по брендам для лучшего контекста
    const brandsWithModels = brands?.map(brand => {
      const brandModels = models?.filter(m => m.car_brands?.name === brand.name);
      return `${brand.name}: ${brandModels?.map(m => m.name).join(', ') || 'нет моделей'}`;
    }).join('\n') || '';
    
    const brandsList = brands?.map(b => b.name).join(', ') || '';

    // Получаем обучающие данные от модераторов
    const corrections = await getRecentCorrections();
    console.log(`📚 Moderator corrections loaded: ${corrections ? 'YES' : 'NO'}`);
    // Статический промт с правилами обучения
    const staticPrompt = `${corrections}

${translationRulesContext}

ВАЖНО! Это товар автозапчастей. Следуй правилам:

1. КОДЫ ДЕТАЛЕЙ НЕ ЯВЛЯЮТСЯ МОДЕЛЯМИ АВТОМОБИЛЕЙ:
   - 1ZZ, 2JZ, K20A, B20, SR20 - это коды двигателей, НЕ модели
   - Camry, Corolla, Civic, Accord - это модели автомобилей
   - Если в названии есть код детали И модель автомобиля - выбирай МОДЕЛЬ АВТОМОБИЛЯ

2. ПРАВИЛА ОПРЕДЕЛЕНИЯ МАРКИ И МОДЕЛИ:
   - Если упомянут "Camry" → марка: Toyota, модель: Camry
   - Если упомянут "Civic" → марка: Honda, модель: Civic
   - Если только код двигателя (1ZZ) без модели → марка: Toyota (если знаешь), модель: null
   
3. ЧАСТЫЕ ОШИБКИ: engene→engine, bamper→bumper, transmision→transmission

4. ПРИМЕРЫ ПРАВИЛЬНОЙ ОБРАБОТКИ:
   - "engine 1zz camry" → Двигатель 1ZZ для Toyota Camry → brand: Toyota, model: Camry
   - "1zz engine toyota" → Двигатель 1ZZ Toyota → brand: Toyota, model: null
   - "civic k20 engine" → Двигатель K20 для Honda Civic → brand: Honda, model: Civic

Товар: "${title}"

ДОСТУПНЫЕ МАРКИ И ИХ МОДЕЛИ:
${brandsWithModels}

ТОЛЬКО эти марки разрешены: ${brandsList}

JSON ответ:
{
  "title_ru": "название на русском (исправь ошибки, переведи)",
  "brand": "точная марка из списка или null", 
  "model": "точная модель автомобиля (НЕ код детали) или null",
  "confidence": 0.0-1.0
}`;

    console.log(`📝 Using static prompt for product enrichment`);
    console.log(`📄 Prompt length: ${staticPrompt.length} characters`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'user', content: staticPrompt }
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

    // ВАЖНО: НЕ обновляем основные поля (title, brand, model), только AI предложения
    console.log(`💡 Saving AI suggestions for moderator review (confidence: ${result.confidence})`);
    
    const updateData: any = {
      ai_original_title: title, // Сохраняем оригинал продавца
      ai_suggested_title: result.title_ru,
      ai_suggested_brand: result.brand,
      ai_suggested_model: result.model,
      ai_confidence: result.confidence,
      ai_enriched_at: new Date().toISOString(),
      requires_moderation: true // Всегда требует модерации
    };

    console.log(`📝 Updating product ${product_id} with AI data:`, updateData);

    const { error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', product_id);

    if (updateError) {
      console.error('❌ Failed to update product with AI suggestions:', updateError);
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    console.log('✅ AI suggestions saved, awaiting moderator approval');
    
    // Сохраняем лог обработки
    console.log(`📝 Saving AI enrichment log for product ${product_id}`);
    
    const { error: logError } = await supabase
      .from('ai_enrichment_logs')
      .insert({
        product_id,
        input_data: { title, brand, model, description },
        ai_response: result,
        confidence: result.confidence,
        processing_time_ms: processingTime
      });

    if (logError) {
      console.error('❌ Failed to save AI enrichment log:', logError);
      // Не выбрасываем ошибку, так как основная функция уже выполнена
    } else {
      console.log('📝 AI enrichment log saved');
    }

    // ШАГ 1: Извлечение правил из различий между AI и оригиналом
    if (product_id && result.title_ru && title && result.title_ru !== title) {
      try {
        console.log('🎯 Extracting rules from AI vs original title differences...');
        const { error: rulesError } = await extractNewRules(
          result.title_ru,  // AI предложение
          title,            // Оригинальный заголовок
          product_id
        );
        
        if (rulesError) {
          console.warn('⚠️ Failed to extract rules:', rulesError);
        } else {
          console.log('📚 New translation rules extracted and saved');
        }
      } catch (error) {
        console.warn('⚠️ Rules extraction failed:', error);
      }
    }
    
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