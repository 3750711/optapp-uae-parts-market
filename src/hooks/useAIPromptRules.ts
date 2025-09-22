import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AIPromptRule {
  id: string;
  rule_text: string;
  rule_category: string;
  is_active: boolean;
  display_order: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const useAIPromptRules = () => {
  return useQuery({
    queryKey: ['ai-prompt-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_prompt_admin_rules')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as AIPromptRule[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateAIPromptRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (rule: Omit<AIPromptRule, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('ai_prompt_admin_rules')
        .insert(rule)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-prompt-rules'] });
      toast.success('Правило добавлено');
    },
    onError: (error) => {
      console.error('Error creating rule:', error);
      toast.error('Ошибка создания правила');
    },
  });
};

export const useUpdateAIPromptRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AIPromptRule> & { id: string }) => {
      const { data, error } = await supabase
        .from('ai_prompt_admin_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-prompt-rules'] });
      toast.success('Правило обновлено');
    },
    onError: (error) => {
      console.error('Error updating rule:', error);
      toast.error('Ошибка обновления правила');
    },
  });
};

export const useDeleteAIPromptRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_prompt_admin_rules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-prompt-rules'] });
      toast.success('Правило удалено');
    },
    onError: (error) => {
      console.error('Error deleting rule:', error);
      toast.error('Ошибка удаления правила');
    },
  });
};

export const useToggleRuleActive = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('ai_prompt_admin_rules')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-prompt-rules'] });
    },
    onError: (error) => {
      console.error('Error toggling rule:', error);
      toast.error('Ошибка изменения статуса правила');
    },
  });
};