
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { StoreTag } from '@/types/store';

type StoreWithDetails = {
  id: string;
  name: string;
  description: string | null;
  address: string;
  location: string | null;
  phone: string | null;
  owner_name: string | null;
  rating: number | null;
  tags: StoreTag[] | null;
  verified: boolean;
  telegram: string | null;
  created_at: string | null;
  updated_at: string | null;
  seller_id: string | null;
  store_images: {
    id: string;
    url: string;
    is_primary: boolean | null;
  }[];
  seller_name?: string;
  seller_email?: string;
  car_brands?: { id: string; name: string }[];
  car_models?: { id: string; name: string; brand_id: string }[];
};

export const useStoreOperations = (isAdmin: boolean) => {
  const queryClient = useQueryClient();
  const [deletingStoreIds, setDeletingStoreIds] = useState<Set<string>>(new Set());

  // Delete store mutation
  const deleteStoreMutation = useMutation({
    mutationFn: async (storeId: string) => {
      console.log('🔥 DELETION PROCESS STARTED');
      console.log('Store ID to delete:', storeId);
      console.log('Current user admin status:', isAdmin);
      
      setDeletingStoreIds(prev => new Set(prev).add(storeId));
      
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log('Current user:', user?.id);
        
        if (userError || !user) {
          throw new Error('Пользователь не авторизован');
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_type, full_name')
          .eq('id', user.id)
          .single();
          
        console.log('Profile check result:', { profile, profileError });
        
        if (profileError) {
          console.error('Profile error:', profileError);
          throw new Error(`Ошибка получения профиля: ${profileError.message}`);
        }
        
        if (!profile || profile.user_type !== 'admin') {
          throw new Error('Недостаточно прав для удаления магазина');
        }
        
        console.log('✅ Admin rights confirmed for user:', profile.full_name);
        
        console.log('🚀 Calling admin_delete_store RPC function...');
        const { data, error } = await supabase
          .rpc('admin_delete_store', { p_store_id: storeId });
        
        console.log('RPC function response:', { data, error });
        
        if (error) {
          console.error('❌ RPC function error:', error);
          throw new Error(`Ошибка функции удаления: ${error.message}`);
        }
        
        if (data !== true) {
          console.error('❌ RPC function returned unexpected result:', data);
          throw new Error('Функция удаления вернула неожиданный результат');
        }
        
        console.log('✅ Store deletion completed successfully');
        return storeId;
      } catch (error: any) {
        console.error('💥 Error in store deletion process:', error);
        
        setDeletingStoreIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(storeId);
          return newSet;
        });
        
        throw error;
      }
    },
    onSuccess: (deletedStoreId) => {
      console.log('🎉 Store deletion successful for ID:', deletedStoreId);
      
      setDeletingStoreIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(deletedStoreId);
        return newSet;
      });
      
      queryClient.invalidateQueries({ queryKey: ['admin', 'stores'] });
      toast.success('Магазин успешно удален');
    },
    onError: (error: any, storeId) => {
      console.error('💀 Store deletion failed:', error);
      
      setDeletingStoreIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(storeId);
        return newSet;
      });
      
      const errorMessage = error.message || 'Неизвестная ошибка при удалении магазина';
      toast.error(`Ошибка при удалении магазина: ${errorMessage}`);
    }
  });

  // Update store mutation
  const updateStoreMutation = useMutation({
    mutationFn: async ({
      store,
      selectedCarBrands,
      selectedCarModels
    }: {
      store: Partial<StoreWithDetails>;
      selectedCarBrands: string[];
      selectedCarModels: {[brandId: string]: string[]};
    }) => {
      const { error } = await supabase
        .from('stores')
        .update({
          name: store.name,
          description: store.description,
          address: store.address,
          location: store.location,
          phone: store.phone,
          owner_name: store.owner_name,
          tags: store.tags,
          verified: store.verified,
          telegram: store.telegram
        })
        .eq('id', store.id);

      if (error) throw error;
      
      if (selectedCarBrands.length > 0) {
        await supabase
          .from('store_car_brands')
          .delete()
          .eq('store_id', store.id);
          
        const brandInserts = selectedCarBrands.map(brandId => ({
          store_id: store.id,
          car_brand_id: brandId
        }));
        
        const { error: brandError } = await supabase
          .from('store_car_brands')
          .insert(brandInserts);
          
        if (brandError) throw brandError;
      }
      
      await supabase
        .from('store_car_models')
        .delete()
        .eq('store_id', store.id);
        
      const modelInserts: {store_id: string, car_model_id: string}[] = [];
      
      Object.keys(selectedCarModels).forEach(brandId => {
        selectedCarModels[brandId].forEach(modelId => {
          modelInserts.push({
            store_id: store.id!,
            car_model_id: modelId
          });
        });
      });
      
      if (modelInserts.length > 0) {
        const { error: modelError } = await supabase
          .from('store_car_models')
          .insert(modelInserts);
          
        if (modelError) throw modelError;
      }
      
      return store;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'stores'] });
      toast.success('Данные магазина обновлены');
    },
    onError: (error) => {
      console.error('Error updating store:', error);
      toast.error('Ошибка при обновлении магазина');
    }
  });

  return {
    deleteStoreMutation,
    updateStoreMutation,
    deletingStoreIds
  };
};
