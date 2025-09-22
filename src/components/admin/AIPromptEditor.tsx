import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Bot, Settings, Eye, BookOpen } from 'lucide-react';
import AdminRulesManager from './AdminRulesManager';
import PromptPreview from './PromptPreview';
import { useAIPromptRules } from '@/hooks/useAIPromptRules';

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

Context Information:
- You have access to a comprehensive list of car brands and models
- Recent moderator corrections are provided to help you learn patterns
- Focus on Russian automotive market terminology

Available car brands and models: {brandsWithModels}

Recent moderator corrections (learn from these): {moderatorCorrections}

Product data to analyze:
Title: {title}
Brand: {brand}
Model: {model}
Category: {category}

Respond with JSON in this exact format:
{
  "title": "Corrected Russian title",
  "brand": "Extracted/corrected brand",
  "model": "Extracted/corrected model or null",
  "confidence": 85
}`;

const AIPromptEditor: React.FC<AIPromptEditorProps> = ({ open, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('edit');
  
  const { data: rules = [] } = useAIPromptRules();
  const activeRulesCount = rules.filter(rule => rule.is_active).length;

  useEffect(() => {
    if (open) {
      loadPrompt();
    }
  }, [open]);

  const loadPrompt = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'ai_prompt_main')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setPrompt(data?.value || DEFAULT_PROMPT);
    } catch (error) {
      console.error('Error loading prompt:', error);
      setPrompt(DEFAULT_PROMPT);
      toast.error('Ошибка загрузки промта, используется промт по умолчанию');
    } finally {
      setLoading(false);
    }
  };

  const savePrompt = async () => {
    if (!prompt.trim()) {
      toast.error('Промт не может быть пустым');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'ai_prompt_main',
          value: prompt.trim(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Промт успешно сохранен');
      onClose();
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast.error('Ошибка сохранения промта');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    setPrompt(DEFAULT_PROMPT);
    toast.info('Промт сброшен к значению по умолчанию');
  };

  const availableVariables = [
    '${moderatorCorrections}',
    '${title}', '${brand}', '${model}', '${category}',
    '${brandsWithModels}', '${brandsList}'
  ];

  const validatePrompt = (promptText: string) => {
    const issues = [];
    
    // Проверка наличия JSON инструкций
    if (!promptText.includes('JSON') && !promptText.includes('json')) {
      issues.push('Промт должен содержать инструкции по формату JSON ответа');
    }
    
    // Проверка основных переменных
    const requiredVars = ['${title}', '${brand}', '${model}'];
    const missingVars = requiredVars.filter(v => !promptText.includes(v));
    if (missingVars.length > 0) {
      issues.push(`Отсутствуют обязательные переменные: ${missingVars.join(', ')}`);
    }
    
    return issues;
  };

  const promptIssues = validatePrompt(prompt);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Редактор ИИ-промта
            {activeRulesCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeRulesCount} правил
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Настройте основной промт и дополнительные правила для обработки товаров с помощью ИИ
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Редактирование
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Правила ({activeRulesCount})
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Предпросмотр
            </TabsTrigger>
            <TabsTrigger value="help" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Справка
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 mt-4 min-h-0">
            <TabsContent value="edit" className="h-full flex flex-col space-y-4">
              {/* Validation Issues */}
              {promptIssues.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded p-3">
                  <h4 className="font-medium text-sm mb-2">Проблемы в промте:</h4>
                  <ul className="text-sm space-y-1">
                    {promptIssues.map((issue, i) => (
                      <li key={i} className="text-destructive">• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Available Variables */}
              <div className="bg-muted/30 rounded p-3">
                <h4 className="font-medium text-sm mb-2">Доступные переменные:</h4>
                <div className="flex flex-wrap gap-1">
                  {availableVariables.map(variable => (
                    <Badge key={variable} variant="outline" className="text-xs font-mono">
                      {variable}
                    </Badge>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Загрузка промта...</span>
                </div>
              ) : (
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Введите основной промт для ИИ..."
                  className="flex-1 min-h-[300px] font-mono text-sm resize-none"
                />
              )}
            </TabsContent>

            <TabsContent value="rules" className="h-full">
              <AdminRulesManager />
            </TabsContent>

            <TabsContent value="preview" className="h-full">
              <PromptPreview mainPrompt={prompt} />
            </TabsContent>

            <TabsContent value="help" className="h-full">
              <div className="space-y-4">
                <div className="bg-muted/30 rounded p-4">
                  <h3 className="font-semibold mb-2">Как работает система промтов</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Система состоит из основного промта и дополнительных администраторских правил, 
                    которые автоматически объединяются при обработке товаров.
                  </p>
                  
                  <h4 className="font-medium mb-2">Структура финального промта:</h4>
                  <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                    <li>Контекст модераторских исправлений</li>
                    <li>Активные администраторские правила (по категориям)</li>
                    <li>Основной промт с инструкциями</li>
                    <li>Данные товара</li>
                    <li>Доступные марки и модели</li>
                    <li>Требования к JSON ответу</li>
                  </ol>
                </div>

                <div className="bg-muted/30 rounded p-4">
                  <h4 className="font-medium mb-2">Рекомендации:</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                    <li>Используйте администраторские правила для частых исправлений</li>
                    <li>Основной промт должен содержать общие инструкции</li>
                    <li>Всегда указывайте формат JSON ответа</li>
                    <li>Тестируйте изменения на вкладке "Предпросмотр"</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={resetToDefault}
            disabled={loading || saving}
          >
            Сбросить к умолчанию
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Отмена
            </Button>
            <Button
              onClick={savePrompt}
              disabled={loading || saving || !prompt.trim() || promptIssues.length > 0}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Сохранение...
                </>
              ) : (
                'Сохранить'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIPromptEditor;