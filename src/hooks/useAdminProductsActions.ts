
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const { toast } = useToast();

  const handleBulkStatusChange = async (status: string) => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Внимание",
        description: "Выберите товары для изменения статуса",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingStatus(true);
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Updating status for products:', selectedProducts, 'to:', status);
      }
      
      const { error } = await supabase
        .from('products')
        .update({ status })
        .in('id', selectedProducts);

      if (error) {
        console.error('❌ Error updating products status:', error);
        throw error;
      }

      toast({
        title: "Успешно",
        description: `Статус ${selectedProducts.length} товаров изменен на "${status}"`,
      });

      setSelectedProducts([]);
      refetch();
    } catch (error) {
      console.error('Error updating bulk status:', error);
      toast({
        title: "Ошибка",
        description: 'Не удалось изменить статус товаров',
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: "Внимание",
        description: "Выберите товары для удаления",
        variant: "destructive",
      });
      return;
    }


    setIsDeleting(true);
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🗑️ Deleting products:', selectedProducts);
      }
      
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', selectedProducts);

      if (error) {
        console.error('❌ Error deleting products:', error);
        throw error;
      }

      toast({
        title: "Успешно",
        description: `${selectedProducts.length} товаров удалено`,
      });

      setSelectedProducts([]);
      refetch();
    } catch (error) {
      console.error('Error deleting bulk products:', error);
      toast({
        title: "Ошибка",
        description: 'Не удалось удалить товары',
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return { 
    handleBulkStatusChange, 
    handleBulkDelete, 
    isDeleting,
    isUpdatingStatus
  };
};
