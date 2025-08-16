import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type Container = Database['public']['Tables']['containers']['Row'];
type ContainerInsert = Database['public']['Tables']['containers']['Insert'];
type ContainerStatus = Database['public']['Enums']['container_status'];

export const useContainers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  // Fetch all containers
  const {
    data: containers,
    isLoading,
    error
  } = useQuery({
    queryKey: ['containers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('containers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Container[];
    }
  });

  // Create new container
  const createContainer = useMutation({
    mutationFn: async (container: Omit<ContainerInsert, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('containers')
        .insert(container)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] });
      toast({
        title: "Контейнер создан",
        description: "Новый контейнер успешно добавлен",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка создания",
        description: error.message || "Не удалось создать контейнер",
        variant: "destructive",
      });
    }
  });

  // Update container status and sync all related orders
  const updateContainerStatus = useMutation({
    mutationFn: async ({ containerNumber, status }: { containerNumber: string; status: ContainerStatus }) => {
      const { error } = await supabase.rpc('update_container_status_and_sync', {
        p_container_number: containerNumber,
        p_new_status: status
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] });
      queryClient.invalidateQueries({ queryKey: ['order-shipments'] });
      toast({
        title: "Статус обновлен",
        description: "Статус контейнера и всех связанных заказов обновлен",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка обновления",
        description: error.message || "Не удалось обновить статус контейнера",
        variant: "destructive",
      });
    }
  });

  // Delete container
  const deleteContainer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('containers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['containers'] });
      toast({
        title: "Контейнер удален",
        description: "Контейнер успешно удален",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка удаления",
        description: error.message || "Не удалось удалить контейнер",
        variant: "destructive",
      });
    }
  });

  // Get orders count for a container
  const getOrdersCountForContainer = async (containerNumber: string) => {
    const { data, error } = await supabase
      .from('order_shipments')
      .select('id', { count: 'exact' })
      .eq('container_number', containerNumber);

    if (error) throw error;
    return data?.length || 0;
  };

  // Filter containers by search term
  const filteredContainers = containers?.filter(container =>
    container.container_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    container.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return {
    containers: filteredContainers,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    createContainer,
    updateContainerStatus,
    deleteContainer,
    getOrdersCountForContainer,
    isCreating: createContainer.isPending,
    isUpdating: updateContainerStatus.isPending,
    isDeleting: deleteContainer.isPending
  };
};