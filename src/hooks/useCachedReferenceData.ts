
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCachedBrands = () => {
  return useQuery({
    queryKey: ['car-brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('car_brands')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useCachedModels = (brandId?: string) => {
  return useQuery({
    queryKey: ['car-models', brandId],
    queryFn: async () => {
      if (!brandId) return [];
      
      const { data, error } = await supabase
        .from('car_models')
        .select('id, name, brand_id')
        .eq('brand_id', brandId)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!brandId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

export const useCachedAllModels = () => {
  return useQuery({
    queryKey: ['all-car-models'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('car_models')
        .select('id, name, brand_id')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

export const useCachedSellers = () => {
  return useQuery({
    queryKey: ['admin-sellers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, opt_id')
        .eq('user_type', 'seller')
        .not('opt_id', 'is', null)
        .neq('opt_id', '')
        .order('full_name');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000,
  });
};
