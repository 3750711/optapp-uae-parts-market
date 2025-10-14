import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface HelpCategory {
  id: string;
  title: string;
  icon_name: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface HelpItem {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface HelpCategoryWithItems extends HelpCategory {
  help_items: HelpItem[];
}

export const useHelpData = () => {
  return useQuery({
    queryKey: ['help-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('help_categories')
        .select(`
          *,
          help_items(*)
        `)
        .order('order_index', { ascending: true });

      if (error) throw error;
      
      // Sort help items within each category
      const sortedData = data.map(category => ({
        ...category,
        help_items: category.help_items.sort((a, b) => a.order_index - b.order_index)
      }));

      return sortedData as HelpCategoryWithItems[];
    },
  });
};

// Hook for filtering help data by target audience (buyer/seller)
export const useFilteredHelpData = (targetAudience: 'buyer' | 'seller') => {
  return useQuery({
    queryKey: ['help-data', targetAudience],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('help_categories')
        .select(`
          *,
          help_items(*)
        `)
        .in('target_audience', ['all', targetAudience])
        .order('order_index', { ascending: true });

      if (error) throw error;
      
      // Sort help items within each category
      const sortedData = data.map(category => ({
        ...category,
        help_items: category.help_items.sort((a, b) => a.order_index - b.order_index)
      }));

      return sortedData as HelpCategoryWithItems[];
    },
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: Omit<HelpCategory, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('help_categories')
        .insert(category)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-data'] });
      toast.success('Категория успешно создана');
    },
    onError: (error) => {
      toast.error('Ошибка при создании категории: ' + error.message);
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HelpCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('help_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-data'] });
      toast.success('Категория успешно обновлена');
    },
    onError: (error) => {
      toast.error('Ошибка при обновлении категории: ' + error.message);
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('help_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-data'] });
      toast.success('Категория успешно удалена');
    },
    onError: (error) => {
      toast.error('Ошибка при удалении категории: ' + error.message);
    },
  });
};

export const useCreateHelpItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Omit<HelpItem, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('help_items')
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-data'] });
      toast.success('Вопрос успешно создан');
    },
    onError: (error) => {
      toast.error('Ошибка при создании вопроса: ' + error.message);
    },
  });
};

export const useUpdateHelpItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<HelpItem> & { id: string }) => {
      const { data, error } = await supabase
        .from('help_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-data'] });
      toast.success('Вопрос успешно обновлен');
    },
    onError: (error) => {
      toast.error('Ошибка при обновлении вопроса: ' + error.message);
    },
  });
};

export const useDeleteHelpItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('help_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-data'] });
      toast.success('Вопрос успешно удален');
    },
    onError: (error) => {
      toast.error('Ошибка при удалении вопроса: ' + error.message);
    },
  });
};