
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { toast } from 'sonner';

export type StoreWithDetails = {
  id: string;
  name: string;
  description: string | null;
  address: string;
  location: string | null;
  phone: string | null;
  owner_name: string | null;
  rating: number | null;
  tags: any[] | null;
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

export interface StoreFilters {
  search: string;
  verified: 'all' | 'verified' | 'unverified';
  hasLocation: 'all' | 'with' | 'without';
  sortBy: 'name' | 'created_at' | 'rating' | 'verified';
  sortOrder: 'asc' | 'desc';
}

export const useAdminStores = () => {
  const { isAdmin } = useAdminAccess();
  const queryClient = useQueryClient();
  const [deletingStoreIds, setDeletingStoreIds] = useState<Set<string>>(new Set());
  
  const [filters, setFilters] = useState<StoreFilters>({
    search: '',
    verified: 'all',
    hasLocation: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  // Fetch stores with optimized query
  const { data: stores, isLoading, refetch, error } = useQuery({
    queryKey: ['admin', 'stores'],
    queryFn: async () => {
      console.log('🔄 Fetching stores data...');
      
      const { data: storesData, error } = await supabase
        .from('stores')
        .select(`
          *,
          store_images(*),
          profiles!stores_seller_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching stores:', error);
        throw error;
      }

      console.log('✅ Stores fetched successfully:', storesData?.length || 0, 'stores');

      // Process the data to include car brands and models
      const storesWithCarData = await Promise.all(
        (storesData || []).map(async (store: any) => {
          // Fetch car brands and models in parallel
          const [storeBrandsResult, storeModelsResult] = await Promise.all([
            supabase
              .from('store_car_brands')
              .select('car_brand_id, car_brands(id, name)')
              .eq('store_id', store.id),
            supabase
              .from('store_car_models')
              .select('car_model_id, car_models(id, name, brand_id)')
              .eq('store_id', store.id)
          ]);
          
          const carBrands = storeBrandsResult.data?.map(item => item.car_brands) || [];
          const carModels = storeModelsResult.data?.map(item => item.car_models) || [];
          
          return {
            ...store,
            seller_name: store.profiles?.full_name || 'Неизвестно',
            seller_email: store.profiles?.email || 'Неизвестно',
            car_brands: carBrands,
            car_models: carModels
          };
        })
      );

      return storesWithCarData as StoreWithDetails[];
    },
    enabled: isAdmin,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Filter and sort stores
  const filteredStores = useMemo(() => {
    if (!stores) return [];

    let filtered = stores.filter(store => !deletingStoreIds.has(store.id));

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(store =>
        store.name.toLowerCase().includes(searchLower) ||
        store.address.toLowerCase().includes(searchLower) ||
        store.owner_name?.toLowerCase().includes(searchLower) ||
        store.seller_name?.toLowerCase().includes(searchLower)
      );
    }

    // Apply verified filter
    if (filters.verified !== 'all') {
      filtered = filtered.filter(store =>
        filters.verified === 'verified' ? store.verified : !store.verified
      );
    }

    // Apply location filter
    if (filters.hasLocation !== 'all') {
      filtered = filtered.filter(store =>
        filters.hasLocation === 'with' ? !!store.location : !store.location
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: any = a[filters.sortBy];
      let bVal: any = b[filters.sortBy];

      // Handle null values
      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      // Convert to appropriate types for comparison
      if (filters.sortBy === 'rating') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else if (filters.sortBy === 'verified') {
        aVal = a.verified ? 1 : 0;
        bVal = b.verified ? 1 : 0;
      } else if (filters.sortBy === 'created_at') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }

      if (filters.sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    return filtered;
  }, [stores, filters, deletingStoreIds]);

  // Delete store mutation
  const deleteStoreMutation = useMutation({
    mutationFn: async (storeId: string) => {
      console.log('🔥 DELETION PROCESS STARTED');
      setDeletingStoreIds(prev => new Set(prev).add(storeId));
      
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', (await supabase.auth.getUser()).data.user?.id)
          .single();
          
        if (profileError || profile?.user_type !== 'admin') {
          throw new Error('Недостаточно прав для удаления магазина');
        }
        
        const { data, error } = await supabase
          .rpc('admin_delete_store', { p_store_id: storeId });
        
        if (error) {
          throw new Error(`Ошибка функции удаления: ${error.message}`);
        }
        
        if (data !== true) {
          throw new Error('Функция удаления вернула неожиданный результат');
        }
        
        return storeId;
      } catch (error: any) {
        setDeletingStoreIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(storeId);
          return newSet;
        });
        throw error;
      }
    },
    onSuccess: (deletedStoreId) => {
      setDeletingStoreIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(deletedStoreId);
        return newSet;
      });
      
      queryClient.invalidateQueries({ queryKey: ['admin', 'stores'] });
      refetch();
      toast.success('Магазин успешно удален');
    },
    onError: (error: any, storeId) => {
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
    mutationFn: async ({ store, selectedCarBrands, selectedCarModels }: {
      store: Partial<StoreWithDetails>,
      selectedCarBrands: string[],
      selectedCarModels: {[brandId: string]: string[]}
    }) => {
      // Update store basic info
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
      
      // Update car brands
      if (selectedCarBrands.length > 0) {
        await supabase.from('store_car_brands').delete().eq('store_id', store.id);
        
        const brandInserts = selectedCarBrands.map(brandId => ({
          store_id: store.id,
          car_brand_id: brandId
        }));
        
        const { error: brandError } = await supabase
          .from('store_car_brands')
          .insert(brandInserts);
          
        if (brandError) throw brandError;
      }
      
      // Update car models
      await supabase.from('store_car_models').delete().eq('store_id', store.id);
      
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
    stores: filteredStores,
    isLoading,
    error,
    refetch,
    filters,
    setFilters,
    deletingStoreIds,
    deleteStoreMutation,
    updateStoreMutation
  };
};
