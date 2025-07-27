import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

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
      const { error } = await supabase
        .from('products')
        .update({ [field]: value })
        .eq('id', productId);

      if (error) throw error;

      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      
      toast.success('Product updated successfully');
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
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
        return;
      }

      await updateField('delivery_price', value);
    } catch (error) {
      console.error('Error updating delivery price:', error);
      toast.error('Failed to update delivery price');
      throw error;
    } finally {
      setIsUpdating(false);
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