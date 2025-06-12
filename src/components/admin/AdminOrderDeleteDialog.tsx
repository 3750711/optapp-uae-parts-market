
import React from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Database } from '@/integrations/supabase/types';
import { Loader2 } from "lucide-react";

type Order = Database['public']['Tables']['orders']['Row'] & {
  buyer: {
    telegram: string | null;
    full_name: string | null;
    opt_id: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  seller: {
    telegram: string | null;
    full_name: string | null;
    opt_id: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};

interface AdminOrderDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

export const AdminOrderDeleteDialog: React.FC<AdminOrderDeleteDialogProps> = ({
  open,
  onOpenChange,
  order
}) => {
  const queryClient = useQueryClient();

  const deleteOrderMutation = useMutation({
    mutationFn: async () => {
      if (!order?.id) return null;

      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', order.id);

      if (error) throw error;
      return order.id;
    },
    onMutate: async () => {
      if (!order?.id) return;

      // Отменяем текущие запросы для предотвращения конфликтов
      await queryClient.cancelQueries({ queryKey: ['admin-orders'] });
      
      // Оптимистично обновляем кэш - удаляем заказ из списка
      queryClient.setQueryData(['admin-orders-optimized'], (oldData: any) => {
        if (!oldData?.data) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.filter((existingOrder: any) => existingOrder.id !== order.id),
          totalCount: Math.max(0, (oldData.totalCount || 1) - 1)
        };
      });

      // Также обновляем другие возможные кэши заказов
      queryClient.setQueryData(['admin-orders'], (oldData: any) => {
        if (!oldData?.data) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.filter((existingOrder: any) => existingOrder.id !== order.id)
        };
      });
    },
    onSuccess: () => {
      // Инвалидируем все связанные кэши для обеспечения консистентности
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders-optimized'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'metrics'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'metrics-optimized'] });
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      
      toast({
        title: "Заказ удален",
        description: "Заказ успешно удален из системы",
      });
      onOpenChange(false);
    },
    onError: (error, variables, context) => {
      console.error('Error deleting order:', error);
      
      // В случае ошибки откатываем оптимистичные изменения
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders-optimized'] });
      
      toast({
        title: "Ошибка",
        description: "Не удалось удалить заказ",
        variant: "destructive",
      });
    }
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Удалить заказ № {order?.order_number}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Это действие нельзя отменить. Заказ будет удален из системы.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отмена</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-500 hover:bg-red-600"
            onClick={(e) => {
              e.preventDefault();
              deleteOrderMutation.mutate();
            }}
            disabled={deleteOrderMutation.isPending}
          >
            {deleteOrderMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Удаление...
              </>
            ) : (
              'Удалить'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
