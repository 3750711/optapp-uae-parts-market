
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCachedBrands = () => {
  return useQuery({
    queryKey: ['car-data', 'brands'],
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .from('car_brands')
        .select('id, name')
        .order('name')
        .abortSignal(signal);
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: (failureCount, error) => {
      // Don't retry 4xx errors
      if (error?.message?.includes('4')) return false;
      return failureCount < 2;
    },
  });
};

export const useCachedModels = (brandId?: string) => {
  return useQuery({
    queryKey: ['car-data', 'models', brandId],
    queryFn: async ({ signal }) => {
      if (!brandId) return [];
      
      const { data, error } = await supabase
        .from('car_models')
        .select('id, name, brand_id')
        .eq('brand_id', brandId)
        .order('name')
        .abortSignal(signal);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!brandId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: (failureCount, error) => {
      if (error?.message?.includes('4')) return false;
      return failureCount < 2;
    },
  });
};

export const useCachedAllModels = () => {
  return useQuery({
    queryKey: ['car-data', 'all-models'],
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .from('car_models')
        .select('id, name, brand_id')
        .order('name')
        .limit(2000)
        .abortSignal(signal);
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes for all models
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: (failureCount, error) => {
      if (error?.message?.includes('4')) return false;
      return failureCount < 2;
    },
  });
};

export const useCachedSellers = () => {
  return useQuery({
    queryKey: ['admin-data', 'sellers'],
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, opt_id')
        .eq('user_type', 'seller')
        .not('opt_id', 'is', null)
        .neq('opt_id', '')
        .order('full_name')
        .abortSignal(signal);
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: (failureCount, error) => {
      if (error?.message?.includes('4')) return false;
      return failureCount < 2;
    },
  });
};
