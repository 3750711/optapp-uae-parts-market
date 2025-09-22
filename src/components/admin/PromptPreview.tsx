import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye } from 'lucide-react';
import { useAIPromptRules } from '@/hooks/useAIPromptRules';

interface PromptPreviewProps {
  mainPrompt: string;
}

const PromptPreview: React.FC<PromptPreviewProps> = ({ mainPrompt }) => {
  const { data: rules = [] } = useAIPromptRules();
  
  const activeRules = rules.filter(rule => rule.is_active);
  
  // Группировка правил по категориям
  const rulesByCategory = activeRules.reduce((acc, rule) => {
    if (!acc[rule.rule_category]) {
      acc[rule.rule_category] = [];
    }
    acc[rule.rule_category].push(rule);
    return acc;
  }, {} as Record<string, typeof activeRules>);

  const categoryLabels = {
    translations: 'СПЕЦИАЛЬНЫЕ ПЕРЕВОДЫ',
    spelling: 'ИСПРАВЛЕНИЯ ОШИБОК',
    part_codes: 'ПРАВИЛА ДЛЯ КОДОВ ДЕТАЛЕЙ',
    brands: 'ПРАВИЛА ДЛЯ МАРОК И МОДЕЛЕЙ',
    general: 'ОБЩИЕ ПРАВИЛА',
  };

  // Создание финального промта
  const createFinalPrompt = () => {
    let prompt = mainPrompt;
    
    // Добавляем активные правила по категориям
    if (activeRules.length > 0) {
      const rulesSection = Object.entries(rulesByCategory)
        .sort(([, a], [, b]) => Math.min(...a.map(r => r.display_order)) - Math.min(...b.map(r => r.display_order)))
        .map(([category, categoryRules]) => {
          const categoryLabel = categoryLabels[category as keyof typeof categoryLabels] || category.toUpperCase();
          const rulesText = categoryRules
            .sort((a, b) => a.display_order - b.display_order)
            .map(rule => `   - ${rule.rule_text}`)
            .join('\n');
          
          return `\n${categoryLabel}:\n${rulesText}`;
        })
        .join('\n');
      
      // Вставляем правила после первой секции moderatorCorrections
      const moderatorCorrectionsIndex = prompt.indexOf('{moderatorCorrections}');
      if (moderatorCorrectionsIndex !== -1) {
        const insertPosition = prompt.indexOf('\n', moderatorCorrectionsIndex);
        if (insertPosition !== -1) {
          prompt = 
            prompt.slice(0, insertPosition) + 
            rulesSection + 
            prompt.slice(insertPosition);
        }
      } else {
        // Если нет moderatorCorrections, добавляем в начало
        prompt = rulesSection + '\n\n' + prompt;
      }
    }
    
    return prompt;
  };

  const finalPrompt = createFinalPrompt();

  // Подстановка примерных данных для демонстрации
  const sampleData = {
    title: 'engene 1zz camry',
    brand: 'toyota',
    model: 'camry',
    category: 'Двигатели',
    brandsWithModels: 'Toyota: Camry, Corolla, Prius...\nHonda: Civic, Accord, CR-V...',
    brandsList: 'Toyota, Honda, BMW, Mercedes, Audi, Nissan',
    moderatorCorrections: 'Недавние исправления модераторов:\n- "engene" → "engine"\n- "bamper" → "bumper"'
  };

  const previewPrompt = finalPrompt
    .replace(/{title}/g, sampleData.title)
    .replace(/{brand}/g, sampleData.brand)
    .replace(/{model}/g, sampleData.model)
    .replace(/{category}/g, sampleData.category)
    .replace(/{brandsWithModels}/g, sampleData.brandsWithModels)
    .replace(/{brandsList}/g, sampleData.brandsList)
    .replace(/{moderatorCorrections}/g, sampleData.moderatorCorrections);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Eye className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Предпросмотр финального промта</h3>
        <Badge variant="outline" className="text-xs">
          {activeRules.length} активных правил
        </Badge>
      </div>

      {/* Статистика по правилам */}
      {activeRules.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(rulesByCategory).map(([category, categoryRules]) => (
            <Badge key={category} variant="secondary" className="text-xs">
              {categoryLabels[category as keyof typeof categoryLabels] || category}: {categoryRules.length}
            </Badge>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Промт с подставленными данными</CardTitle>
          <p className="text-sm text-muted-foreground">
            Пример того, как будет выглядеть промт для товара "{sampleData.title}"
          </p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full">
            <pre className="text-sm whitespace-pre-wrap font-mono bg-muted/30 p-4 rounded">
              {previewPrompt}
            </pre>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Ожидаемый JSON ответ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ожидаемый JSON ответ</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm bg-muted/30 p-4 rounded font-mono">
{`{
  "title_ru": "Двигатель 1ZZ для Toyota Camry",
  "brand": "Toyota",
  "model": "Camry",
  "confidence": 0.85
}`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default PromptPreview;