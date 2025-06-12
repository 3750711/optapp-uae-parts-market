
import React from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useErrorHandler } from '@/hooks/useErrorHandler';

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
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);
  const { handleError } = useErrorHandler();

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
      console.log('🔄 Updating status for products:', selectedProducts, 'to:', status);
      
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
      handleError(error, {
        customMessage: 'Не удалось изменить статус товаров',
        logError: true
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

    // Подтверждение удаления
    const confirmed = window.confirm(
      `Вы уверены, что хотите удалить ${selectedProducts.length} товаров? Это действие нельзя отменить.`
    );
    
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      console.log('🗑️ Deleting products:', selectedProducts);
      
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
      handleError(error, {
        customMessage: 'Не удалось удалить товары',
        logError: true
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
