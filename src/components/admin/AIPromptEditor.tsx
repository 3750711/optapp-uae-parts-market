import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Bot } from 'lucide-react';

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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Редактор ИИ-промта
          </DialogTitle>
          <DialogDescription>
            Настройте основной промт для обработки товаров с помощью ИИ. 
            Доступные переменные: {`{title}`}, {`{brand}`}, {`{model}`}, {`{category}`}, {`{brandsWithModels}`}, {`{moderatorCorrections}`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Загрузка промта...</span>
            </div>
          ) : (
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Введите промт для ИИ..."
              className="min-h-[400px] font-mono text-sm"
            />
          )}
        </div>

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
              disabled={loading || saving || !prompt.trim()}
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