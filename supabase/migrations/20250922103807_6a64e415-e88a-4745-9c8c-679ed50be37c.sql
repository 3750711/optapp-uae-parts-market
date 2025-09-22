-- Update the custom AI prompt to match the expected format and variables
UPDATE app_settings 
SET value = '${moderatorCorrections}

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

5. СПЕЦИАЛЬНЫЕ ПРАВИЛА ПЕРЕВОДА:
   - "Носовая часть" → всегда переводи как "Nose cut"

Товар: "{title}"
Бренд: "{brand}"
Модель: "{model}"
Категория: "{category}"

ДОСТУПНЫЕ МАРКИ И ИХ МОДЕЛИ:
{brandsWithModels}

ТОЛЬКО эти марки разрешены: {brandsList}

JSON ответ:
{
  "title_ru": "название на русском (исправь ошибки, переведи)",
  "brand": "точная марка из списка или null", 
  "model": "точная модель автомобиля (НЕ код детали) или null",
  "confidence": 0.85
}'
WHERE key = 'ai_prompt_main';