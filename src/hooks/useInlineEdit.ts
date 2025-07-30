import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { criticalError } from '@/utils/productionOptimizer';

interface UseInlineEditProps {
  productId: string;
  onUpdate?: () => void;
}

export const useInlineEdit = ({ productId, onUpdate }: UseInlineEditProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const updateField = async (field: string, value: string | number) => {
    setIsUpdating(true);
    
    try {
      // Only perform optimistic update if we have existing data
      const existingData = queryClient.getQueryData(['seller-product', productId]);
      if (existingData) {
        queryClient.setQueryData(['seller-product', productId], (oldData: any) => {
          if (oldData) {
            return { ...oldData, [field]: value };
          }
          return oldData;
        });
      }

      const { error } = await supabase
        .from('products')
        .update({ [field]: value })
        .eq('id', productId);

      if (error) throw error;

      // Invalidate all relevant caches
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['seller-product', productId] });
      queryClient.invalidateQueries({ queryKey: ['products-infinite'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      
      toast.success('Product updated successfully');
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      criticalError(error as Error, { 
        context: 'useInlineEdit.updateField', 
        productId, 
        field, 
        value 
      });
      toast.error('Failed to update product');
      
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['seller-product', productId] });
      
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const updateDeliveryPrice = async (value: string | number) => {
    setIsUpdating(true);
    
    try {
      // Check current product status
      const { data: currentProduct, error: fetchError } = await supabase
        .from('products')
        .select('status')
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;

      if (currentProduct.status === 'active') {
        toast.error('Cannot change delivery price for published products');
        setIsUpdating(false);
        return;
      }

      await updateField('delivery_price', value);
    } catch (error) {
      criticalError(error as Error, { 
        context: 'useInlineEdit.updateDeliveryPrice', 
        productId, 
        deliveryPrice: value 
      });
      toast.error('Failed to update delivery price');
      throw error;
    }
  };

  const createFieldUpdater = (field: string) => {
    return async (value: string | number) => {
      await updateField(field, value);
    };
  };

  return {
    isUpdating,
    updateField,
    createFieldUpdater,
    updateTitle: createFieldUpdater('title'),
    updatePrice: createFieldUpdater('price'),
    updateDescription: createFieldUpdater('description'),
    updateBrand: createFieldUpdater('brand'),
    updateModel: createFieldUpdater('model'),
    updateCondition: createFieldUpdater('condition'),
    updatePlaceNumber: createFieldUpdater('place_number'),
    updateDeliveryPrice,
    updateLocation: createFieldUpdater('product_location'),
  };
};