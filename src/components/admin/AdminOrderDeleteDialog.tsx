
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast({
        title: "Заказ удален",
        description: "Заказ успешно удален из системы",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error deleting order:', error);
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
