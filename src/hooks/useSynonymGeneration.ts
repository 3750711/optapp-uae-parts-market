import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GenerateSynonymsParams {
  term: string;
  category?: 'brand' | 'model' | 'part' | 'general';
  language?: 'ru' | 'en';
}

interface SynonymGenerationResult {
  success: boolean;
  term: string;
  category: string;
  language: string;
  synonyms: string[];
  inserted: number;
  error?: string;
}

export const useSynonymGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateSynonyms = async (params: GenerateSynonymsParams): Promise<SynonymGenerationResult | null> => {
    if (!params.term || params.term.trim().length === 0) {
      toast({
        title: "Ошибка",
        description: "Термин не может быть пустым",
        variant: "destructive",
      });
      return null;
    }

    setIsGenerating(true);

    try {
      console.log('Generating synonyms for:', params);

      const { data, error } = await supabase.functions.invoke('generate-synonyms', {
        body: {
          term: params.term.trim(),
          category: params.category || 'general',
          language: params.language || 'ru'
        }
      });

      if (error) {
        console.error('Error generating synonyms:', error);
        toast({
          title: "Ошибка генерации синонимов",
          description: error.message || "Попробуйте еще раз",
          variant: "destructive",
        });
        return null;
      }

      if (data && data.success) {
        toast({
          title: "Синонимы успешно созданы",
          description: `Добавлено ${data.inserted} записей для термина "${data.term}"`,
        });
        return data;
      } else {
        toast({
          title: "Ошибка",
          description: data?.error || "Не удалось создать синонимы",
          variant: "destructive",
        });
        return null;
      }

    } catch (error) {
      console.error('Error in synonym generation:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при генерации синонимов",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateSynonyms,
    isGenerating
  };
};