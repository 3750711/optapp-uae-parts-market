
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StoreTag } from '@/types/store';
import { useDebounceValue } from '@/hooks/useDebounceValue';

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

interface UseOptimizedAdminStoresOptions {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  sortBy?: 'created_at' | 'rating' | 'name' | 'verified';
  sortOrder?: 'asc' | 'desc';
  verifiedFilter?: 'all' | 'verified' | 'unverified';
}

export const useOptimizedAdminStores = (options: UseOptimizedAdminStoresOptions = {}) => {
  const { 
    page = 1, 
    pageSize = 20,
    searchQuery = '',
    sortBy = 'created_at',
    sortOrder = 'desc',
    verifiedFilter = 'all'
  } = options;

  const debouncedSearchQuery = useDebounceValue(searchQuery, 500);
  const isSearching = searchQuery !== debouncedSearchQuery;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-stores-optimized', page, pageSize, debouncedSearchQuery, sortBy, sortOrder, verifiedFilter],
    queryFn: async () => {
      console.log('🔍 Fetching optimized stores data...');
      
      // Оптимизированный запрос с JOIN для получения всех данных за один раз
      let query = supabase
        .from('stores')
        .select(`
          *,
          store_images(*),
          profiles!stores_seller_id_fkey(full_name, email),
          store_car_brands(
            car_brands(id, name)
          ),
          store_car_models(
            car_models(id, name, brand_id)
          )
        `)
        .range((page - 1) * pageSize, page * pageSize - 1);

      // Добавляем поиск если есть запрос
      if (debouncedSearchQuery.trim()) {
        query = query.or(`name.ilike.%${debouncedSearchQuery}%,description.ilike.%${debouncedSearchQuery}%,address.ilike.%${debouncedSearchQuery}%`);
      }

      // Фильтр по верификации
      if (verifiedFilter !== 'all') {
        query = query.eq('verified', verifiedFilter === 'verified');
      }

      // Сортировка
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data: storesData, error: storesError } = await query;
      
      if (storesError) {
        console.error('❌ Stores query error:', storesError);
        throw storesError;
      }
      
      console.log('✅ Optimized stores data received:', storesData?.length || 0, 'stores');

      // Преобразуем данные в нужный формат
      const transformedStores: StoreWithDetails[] = (storesData || []).map(store => ({
        ...store,
        seller_name: store.profiles?.full_name || 'Неизвестно',
        seller_email: store.profiles?.email || 'Неизвестно',
        car_brands: store.store_car_brands?.map(scb => scb.car_brands).filter(Boolean) || [],
        car_models: store.store_car_models?.map(scm => scm.car_models).filter(Boolean) || []
      }));

      // Получаем общее количество для пагинации
      let totalCountQuery = supabase
        .from('stores')
        .select('*', { count: 'exact', head: true });

      if (debouncedSearchQuery.trim()) {
        totalCountQuery = totalCountQuery.or(`name.ilike.%${debouncedSearchQuery}%,description.ilike.%${debouncedSearchQuery}%,address.ilike.%${debouncedSearchQuery}%`);
      }

      if (verifiedFilter !== 'all') {
        totalCountQuery = totalCountQuery.eq('verified', verifiedFilter === 'verified');
      }

      const { count: totalCount } = await totalCountQuery;

      return {
        stores: transformedStores,
        totalCount: totalCount || 0,
        hasNextPage: page * pageSize < (totalCount || 0),
        hasPreviousPage: page > 1,
        currentPage: page,
        totalPages: Math.ceil((totalCount || 0) / pageSize)
      };
    },
    staleTime: 1000 * 60 * 5, // 5 минут кэширования
    gcTime: 1000 * 60 * 10, // 10 минут в памяти
    retry: (failureCount, error: any) => {
      if (error?.message?.includes('permission') || error?.code === 'PGRST301') {
        return false;
      }
      return failureCount < 2;
    },
  });

  return {
    data: data?.stores || [],
    totalCount: data?.totalCount || 0,
    hasNextPage: data?.hasNextPage || false,
    hasPreviousPage: data?.hasPreviousPage || false,
    currentPage: data?.currentPage || page,
    totalPages: data?.totalPages || 1,
    isLoading: isLoading || isSearching,
    isSearching,
    error,
    refetch
  };
};
