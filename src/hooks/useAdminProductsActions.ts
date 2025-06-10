
import React from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UseAdminProductsActionsProps {
  selectedProducts: string[];
  setSelectedProducts: (products: string[]) => void;
  refetch: () => void;
}

export const useAdminProductsActions = ({
  selectedProducts,
  setSelectedProducts,
  refetch
}: UseAdminProductsActionsProps) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleBulkStatusChange = async (status: string) => {
    if (selectedProducts.length === 0) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ status })
        .in('id', selectedProducts);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: `Статус ${selectedProducts.length} товаров изменен на "${status}"`,
      });

      setSelectedProducts([]);
      refetch();
    } catch (error) {
      console.error('Error updating products:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус товаров",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', selectedProducts);

      if (error) throw error;

      toast({
        title: "Успешно",
        description: `${selectedProducts.length} товаров удалено`,
      });

      setSelectedProducts([]);
      refetch();
    } catch (error) {
      console.error('Error deleting products:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить товары",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return { handleBulkStatusChange, handleBulkDelete, isDeleting };
};
