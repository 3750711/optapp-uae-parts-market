import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AITranslationRule {
  id: string;
  original_phrase: string;
  corrected_phrase: string;
  usage_count: number;
  confidence_score: number;
  rule_type: string;
  language_pair: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_used_at?: string;
  created_by?: string;
}

export interface AITranslationRuleCreate {
  original_phrase: string;
  corrected_phrase: string;
  rule_type?: string;
  confidence_score?: number;
  language_pair?: string;
}

export interface AITranslationRuleUpdate {
  original_phrase?: string;
  corrected_phrase?: string;
  rule_type?: string;
  confidence_score?: number;
  is_active?: boolean;
}

export const useAITranslationRules = () => {
  const queryClient = useQueryClient();

  // Получение всех правил
  const {
    data: rules,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['ai-translation-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_translation_rules')
        .select('*')
        .order('usage_count', { ascending: false });
      
      if (error) {
        console.error('Error fetching translation rules:', error);
        throw error;
      }
      
      return data as AITranslationRule[];
    },
    staleTime: 5 * 60 * 1000, // 5 минут
  });

  // Получение активных правил для использования
  const { data: activeRules } = useQuery({
    queryKey: ['ai-translation-rules-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_translation_rules')
        .select('original_phrase, corrected_phrase, usage_count, confidence_score')
        .eq('is_active', true)
        .order('usage_count', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 минут для активных правил
  });

  // Создание нового правила
  const createRule = useMutation({
    mutationFn: async (newRule: AITranslationRuleCreate) => {
      // Проверяем, не существует ли уже такое правило
      const { data: existing } = await supabase
        .from('ai_translation_rules')
        .select('id')
        .eq('original_phrase', newRule.original_phrase)
        .eq('corrected_phrase', newRule.corrected_phrase)
        .maybeSingle();

      if (existing) {
        throw new Error('Такое правило уже существует');
      }

      const { data, error } = await supabase
        .from('ai_translation_rules')
        .insert([newRule])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (newRule) => {
      queryClient.invalidateQueries({ queryKey: ['ai-translation-rules'] });
      queryClient.invalidateQueries({ queryKey: ['ai-translation-rules-active'] });
      toast.success(`Правило создано: "${newRule.original_phrase}" → "${newRule.corrected_phrase}"`);
    },
    onError: (error: Error) => {
      toast.error(`Ошибка создания правила: ${error.message}`);
    },
  });

  // Обновление правила
  const updateRule = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: AITranslationRuleUpdate }) => {
      const { data, error } = await supabase
        .from('ai_translation_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (updatedRule) => {
      queryClient.invalidateQueries({ queryKey: ['ai-translation-rules'] });
      queryClient.invalidateQueries({ queryKey: ['ai-translation-rules-active'] });
      toast.success(`Правило обновлено: "${updatedRule.original_phrase}" → "${updatedRule.corrected_phrase}"`);
    },
    onError: (error: Error) => {
      toast.error(`Ошибка обновления правила: ${error.message}`);
    },
  });

  // Удаление правила
  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_translation_rules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-translation-rules'] });
      queryClient.invalidateQueries({ queryKey: ['ai-translation-rules-active'] });
      toast.success('Правило удалено');
    },
    onError: (error: Error) => {
      toast.error(`Ошибка удаления правила: ${error.message}`);
    },
  });

  // Переключение активности правила
  const toggleRuleActive = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('ai_translation_rules')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (rule) => {
      queryClient.invalidateQueries({ queryKey: ['ai-translation-rules'] });
      queryClient.invalidateQueries({ queryKey: ['ai-translation-rules-active'] });
      toast.success(`Правило ${rule.is_active ? 'активировано' : 'деактивировано'}`);
    },
    onError: (error: Error) => {
      toast.error(`Ошибка изменения статуса: ${error.message}`);
    },
  });

  // Пакетное применение правил к тексту (для тестирования)
  const applyRulesToText = useMutation({
    mutationFn: async (text: string) => {
      const { data, error } = await supabase.rpc('apply_translation_rules', {
        p_text: text,
        p_limit: 50
      });
      
      if (error) throw error;
      return data;
    },
    onError: (error: Error) => {
      toast.error(`Ошибка применения правил: ${error.message}`);
    },
  });

  return {
    rules: rules || [],
    activeRules: activeRules || [],
    isLoading,
    error,
    refetch,
    createRule: createRule.mutate,
    updateRule: updateRule.mutate,
    deleteRule: deleteRule.mutate,
    toggleRuleActive: toggleRuleActive.mutate,
    applyRulesToText: applyRulesToText.mutate,
    isCreating: createRule.isPending,
    isUpdating: updateRule.isPending,
    isDeleting: deleteRule.isPending,
    isToggling: toggleRuleActive.isPending,
    isApplying: applyRulesToText.isPending
  };
};