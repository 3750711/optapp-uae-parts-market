
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'];

interface UseAdminOrderFormProps {
  order: Order | null;
  onClose: () => void;
  orderImages: string[];
  orderVideos: string[];
}

export const useAdminOrderForm = ({ order, onClose, orderImages, orderVideos }: UseAdminOrderFormProps) => {
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      order_number: '',
      title: '',
      brand: '',
      model: '',
      price: '',
      place_number: '1',
      status: 'created',
      description: '',
      delivery_price_confirm: '',
      delivery_method: 'self_pickup',
    }
  });

  useEffect(() => {
    if (order) {
      form.reset({
        order_number: order.order_number?.toString() || '',
        title: order.title || '',
        brand: order.brand || '',
        model: order.model || '',
        price: order.price?.toString() || '',
        place_number: order.place_number?.toString() || '1',
        status: order.status || 'created',
        description: order.description || '',
        delivery_price_confirm: order.delivery_price_confirm?.toString() || '',
        delivery_method: order.delivery_method || 'self_pickup',
      });
    }
  }, [order, form.reset]);

  const { mutate: updateOrder, isPending: isSaving } = useMutation({
    mutationFn: async (values: any) => {
      if (!order?.id) throw new Error("ID заказа отсутствует");

      // 1. Обновляем основные данные заказа и массив изображений
      const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({
          title: values.title,
          brand: values.brand || null,
          model: values.model || null,
          price: parseFloat(values.price) || 0,
          place_number: parseInt(values.place_number, 10) || 1,
          status: values.status,
          description: values.description || null,
          delivery_price_confirm: parseFloat(values.delivery_price_confirm) || null,
          delivery_method: values.delivery_method,
          images: orderImages,
        })
        .eq('id', order.id);
      
      if (orderUpdateError) throw orderUpdateError;

      // 2. Полностью перезаписываем видео в таблице order_videos для простоты и надежности
      await supabase.from('order_videos').delete().eq('order_id', order.id);

      if (orderVideos.length > 0) {
        const videoInserts = orderVideos.map(url => ({ order_id: order.id, url }));
        const { error: videoInsertError } = await supabase.from('order_videos').insert(videoInserts);
        if (videoInsertError) throw videoInsertError;
      }
    },
    onSuccess: () => {
      // Оптимистично обновляем кэш с is_modified: true
      queryClient.setQueryData(['admin-orders-optimized'], (oldData: any) => {
        if (!oldData?.data) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.map((cachedOrder: any) => 
            cachedOrder.id === order?.id 
              ? { ...cachedOrder, is_modified: true }
              : cachedOrder
          )
        };
      });

      // Также обновляем стандартный кэш заказов
      queryClient.setQueryData(['admin-orders'], (oldData: any) => {
        if (!oldData?.data) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.map((cachedOrder: any) => 
            cachedOrder.id === order?.id 
              ? { ...cachedOrder, is_modified: true }
              : cachedOrder
          )
        };
      });

      // Обновляем конкретный заказ в кэше если он есть
      queryClient.setQueryData(['order', order?.id], (oldOrder: any) => {
        if (!oldOrder) return oldOrder;
        return { ...oldOrder, is_modified: true };
      });

      toast({ title: "Успех", description: "Заказ успешно обновлен." });
      queryClient.invalidateQueries({ queryKey: ['admin-orders-optimized'] });
      queryClient.invalidateQueries({ queryKey: ['order', order?.id] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка обновления",
        description: error.message || "Не удалось обновить заказ. Попробуйте еще раз.",
        variant: "destructive",
      });
      console.error("Ошибка при обновлении заказа:", error);
    },
  });

  const onSubmit = (values: any) => {
    updateOrder(values);
  };
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!form.formState.isValidating) { // Check if dialog is open implicitly
          if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            form.handleSubmit(onSubmit)();
          }
          if (event.key === 'Escape') {
            onClose();
          }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [form, onSubmit, onClose]);

  return { form, onSubmit, isSaving };
};
