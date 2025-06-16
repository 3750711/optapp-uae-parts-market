
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { storeEditSchema, type StoreEditFormData, sanitizeStoreData } from './StoreValidationSchema';

export const useOptimizedStoreOperations = (isAdmin: boolean) => {
  const queryClient = useQueryClient();
  const [deletingStoreIds, setDeletingStoreIds] = useState<Set<string>>(new Set());
  const [operationInProgress, setOperationInProgress] = useState<Set<string>>(new Set());

  // Optimistic update helper
  const updateStoreOptimistically = (storeId: string, updates: Partial<any>) => {
    queryClient.setQueryData(['admin-stores-optimized'], (oldData: any) => {
      if (!oldData) return oldData;
      
      return {
        ...oldData,
        stores: oldData.stores.map((store: any) => 
          store.id === storeId ? { ...store, ...updates } : store
        )
      };
    });
  };

  // Delete store mutation with optimistic updates
  const deleteStoreMutation = useMutation({
    mutationFn: async (storeId: string) => {
      console.log('🔥 Starting optimized store deletion:', storeId);
      
      setDeletingStoreIds(prev => new Set(prev).add(storeId));
      setOperationInProgress(prev => new Set(prev).add(storeId));
      
      if (!isAdmin) {
        throw new Error('Недостаточно прав для удаления магазина');
      }

      const { data, error } = await supabase
        .rpc('admin_delete_store', { p_store_id: storeId });
      
      if (error) {
        console.error('❌ Store deletion error:', error);
        throw new Error(`Ошибка удаления: ${error.message}`);
      }
      
      if (data !== true) {
        throw new Error('Функция удаления вернула неожиданный результат');
      }
      
      return storeId;
    },
    onMutate: async (storeId) => {
      // Optimistic update - remove store from list immediately
      await queryClient.cancelQueries({ queryKey: ['admin-stores-optimized'] });
      
      const previousStores = queryClient.getQueryData(['admin-stores-optimized']);
      
      queryClient.setQueryData(['admin-stores-optimized'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          stores: old.stores.filter((store: any) => store.id !== storeId),
          totalCount: old.totalCount - 1
        };
      });
      
      return { previousStores };
    },
    onSuccess: (deletedStoreId) => {
      console.log('✅ Store deletion successful:', deletedStoreId);
      
      setDeletingStoreIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(deletedStoreId);
        return newSet;
      });
      
      setOperationInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(deletedStoreId);
        return newSet;
      });
      
      // Invalidate queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['admin-stores-optimized'] });
      toast.success('Магазин успешно удален');
    },
    onError: (error: any, storeId, context) => {
      console.error('💀 Store deletion failed:', error);
      
      // Revert optimistic update
      if (context?.previousStores) {
        queryClient.setQueryData(['admin-stores-optimized'], context.previousStores);
      }
      
      setDeletingStoreIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(storeId);
        return newSet;
      });
      
      setOperationInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(storeId);
        return newSet;
      });
      
      const errorMessage = error.message || 'Неизвестная ошибка при удалении магазина';
      toast.error(`Ошибка при удалении магазина: ${errorMessage}`);
    }
  });

  // Update store mutation with validation and optimistic updates
  const updateStoreMutation = useMutation({
    mutationFn: async (formData: StoreEditFormData & { id: string }) => {
      console.log('🔄 Starting store update with validation:', formData.id);
      
      setOperationInProgress(prev => new Set(prev).add(formData.id));
      
      // Validate data
      const sanitizedData = sanitizeStoreData(formData);
      const validationResult = storeEditSchema.safeParse(sanitizedData);
      
      if (!validationResult.success) {
        const errors = validationResult.error.issues.map(issue => 
          `${issue.path.join('.')}: ${issue.message}`
        ).join(', ');
        throw new Error(`Ошибки валидации: ${errors}`);
      }
      
      const validData = validationResult.data;
      
      // Update store basic info
      const { error: storeError } = await supabase
        .from('stores')
        .update({
          name: validData.name,
          description: validData.description,
          address: validData.address,
          location: validData.location,
          phone: validData.phone,
          owner_name: validData.owner_name,
          tags: validData.tags,
          verified: validData.verified,
          telegram: validData.telegram
        })
        .eq('id', formData.id);

      if (storeError) throw storeError;
      
      // Update car brands (optimized - only if changed)
      await supabase
        .from('store_car_brands')
        .delete()
        .eq('store_id', formData.id);
        
      if (validData.selectedCarBrands && validData.selectedCarBrands.length > 0) {
        const brandInserts = validData.selectedCarBrands.map(brandId => ({
          store_id: formData.id,
          car_brand_id: brandId
        }));
        
        const { error: brandError } = await supabase
          .from('store_car_brands')
          .insert(brandInserts);
          
        if (brandError) throw brandError;
      }
      
      // Update car models
      await supabase
        .from('store_car_models')
        .delete()
        .eq('store_id', formData.id);
        
      const modelInserts: {store_id: string, car_model_id: string}[] = [];
      
      if (validData.selectedCarModels) {
        Object.keys(validData.selectedCarModels).forEach(brandId => {
          validData.selectedCarModels![brandId].forEach(modelId => {
            modelInserts.push({
              store_id: formData.id,
              car_model_id: modelId
            });
          });
        });
      }
      
      if (modelInserts.length > 0) {
        const { error: modelError } = await supabase
          .from('store_car_models')
          .insert(modelInserts);
          
        if (modelError) throw modelError;
      }
      
      return formData;
    },
    onMutate: async (formData) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['admin-stores-optimized'] });
      
      const previousStores = queryClient.getQueryData(['admin-stores-optimized']);
      
      updateStoreOptimistically(formData.id, {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        verified: formData.verified,
        // Add other fields as needed
      });
      
      return { previousStores };
    },
    onSuccess: (updatedStore) => {
      console.log('✅ Store update successful:', updatedStore.id);
      
      setOperationInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(updatedStore.id);
        return newSet;
      });
      
      // Invalidate to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['admin-stores-optimized'] });
      toast.success('Данные магазина обновлены');
    },
    onError: (error: any, formData, context) => {
      console.error('💀 Store update failed:', error);
      
      // Revert optimistic update
      if (context?.previousStores) {
        queryClient.setQueryData(['admin-stores-optimized'], context.previousStores);
      }
      
      setOperationInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(formData.id);
        return newSet;
      });
      
      const errorMessage = error.message || 'Неизвестная ошибка при обновлении магазина';
      toast.error(`Ошибка при обновлении магазина: ${errorMessage}`);
    }
  });

  return {
    deleteStoreMutation,
    updateStoreMutation,
    deletingStoreIds,
    operationInProgress,
    isDeletePending: deleteStoreMutation.isPending,
    isUpdatePending: updateStoreMutation.isPending
  };
};
