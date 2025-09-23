import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Unified cache keys
export const CAR_DATA_KEYS = {
  brands: ['car_brands'] as const,
  models: (brandId?: string) => brandId ? ['car_models', brandId] as const : ['car_models'] as const,
};

export function useOptimizedCarBrands() {
  return useQuery({
    queryKey: CAR_DATA_KEYS.brands,
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .from('car_brands')
        .select('*')
        .order('name')
        .abortSignal(signal);
      
      if (error) throw error;
      return data;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - brands rarely change
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: (failureCount, error: any) => {
      if (error?.name === 'AbortError' || (error?.status >= 400 && error?.status < 500)) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useOptimizedCarModels(brandId?: string) {
  return useQuery({
    queryKey: CAR_DATA_KEYS.models(brandId),
    queryFn: async ({ signal }) => {
      let query = supabase
        .from('car_models')
        .select('*')
        .order('name');
      
      if (brandId) {
        query = query.eq('brand_id', brandId);
      }
      
      const { data, error } = await query.abortSignal(signal);
      
      if (error) throw error;
      return data;
    },
    enabled: !!brandId,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: (failureCount, error: any) => {
      if (error?.name === 'AbortError' || (error?.status >= 400 && error?.status < 500)) {
        return false;
      }
      return failureCount < 2;
    },
  });
}