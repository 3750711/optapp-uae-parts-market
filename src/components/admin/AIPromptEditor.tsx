import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Code, Info } from 'lucide-react';

interface AIPromptEditorProps {
  open: boolean;
  onClose: () => void;
}

const DEFAULT_PROMPT = `You are an expert AI assistant specializing in automotive parts catalog management. Your task is to analyze and enrich product data for automotive parts, providing standardized Russian titles, brands, and models.

CRITICAL INSTRUCTIONS:
1. Always respond in valid JSON format
2. Provide Russian title that is clear and descriptive
3. Extract or correct the brand name (use full brand names, not abbreviations)
4. Extract or identify the model name when possible
5. Provide a confidence score (0-100)

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

Товар: "{title}"

ДОСТУПНЫЕ МАРКИ И ИХ МОДЕЛИ:
{brandsWithModels}

ТОЛЬКО эти марки разрешены: {brandsList}

JSON ответ:
{
  "title_ru": "название на русском (исправь ошибки, переведи)",
  "brand": "точная марка из списка или null", 
  "model": "точная модель автомобиля (НЕ код детали) или null",
  "confidence": 0.0-1.0
}`;

const AIPromptEditor: React.FC<AIPromptEditorProps> = ({ open, onClose }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            ИИ-промт для обработки товаров
          </DialogTitle>
          <DialogDescription>
            Системный промт для автоматической обработки товаров с помощью искусственного интеллекта
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 min-h-0">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="h-4 w-4" />
                Информация о системе
              </CardTitle>
              <CardDescription>
                Система использует фиксированный промт для стабильной работы ИИ-обработки
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-muted/30 rounded p-3">
                <h4 className="font-medium text-sm mb-2">Возможности системы:</h4>
                <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                  <li>Автоматический перевод названий товаров на русский язык</li>
                  <li>Определение марки и модели автомобиля</li>
                  <li>Исправление типичных ошибок в названиях</li>
                  <li>Различение кодов деталей и моделей автомобилей</li>
                  <li>Оценка уверенности в результатах обработки</li>
                </ul>
              </div>
              
              <div className="bg-muted/30 rounded p-3">
                <h4 className="font-medium text-sm mb-2">Обработка:</h4>
                <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                  <li>Все результаты требуют проверки модератором</li>
                  <li>ИИ не изменяет исходные данные товара</li>
                  <li>Предложения сохраняются в отдельных полях для модерации</li>
                  <li>Система использует базу марок и моделей автомобилей</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-1 min-h-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Code className="h-4 w-4" />
                Системный промт
              </CardTitle>
              <CardDescription>
                Текущий промт, используемый для обработки товаров
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded p-4 max-h-96 overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap font-mono text-muted-foreground">
                  {DEFAULT_PROMPT}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIPromptEditor;