import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthProfile } from '@/contexts/auth/AuthProfileContext';
import { CAR_DATA_KEYS } from './useOptimizedCarData';
import { supabase } from '@/integrations/supabase/client';

/**
 * Prefetches data for trusted sellers to improve UX
 */
export function useTrustedSellerPrefetch() {
  const queryClient = useQueryClient();
  const { profile, isAdmin } = useAuthProfile();
  
  const isTrustedSeller = profile?.is_trusted_seller === true;
  const shouldPrefetch = isTrustedSeller || isAdmin;

  useEffect(() => {
    if (!shouldPrefetch) return;

    // Prefetch car brands (critical for trusted seller form)
    queryClient.prefetchQuery({
      queryKey: CAR_DATA_KEYS.brands,
      queryFn: async () => {
        const { data, error } = await supabase
          .from('car_brands')
          .select('*')
          .order('name');
        
        if (error) throw error;
        return data;
      },
      staleTime: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Prefetch popular car models (top 10 brands)
    const popularBrandIds = [
      'toyota', 'honda', 'ford', 'chevrolet', 'nissan',
      'hyundai', 'kia', 'volkswagen', 'bmw', 'mercedes-benz'
    ];

    popularBrandIds.forEach(brandName => {
      queryClient.prefetchQuery({
        queryKey: ['car_models_by_brand_name', brandName],
        queryFn: async () => {
          const { data: brandData } = await supabase
            .from('car_brands')
            .select('id')
            .eq('name', brandName)
            .single();

          if (!brandData) return [];

          const { data, error } = await supabase
            .from('car_models')
            .select('*')
            .eq('brand_id', brandData.id)
            .order('name');
          
          if (error) throw error;
          return data;
        },
        staleTime: 24 * 60 * 60 * 1000,
      });
    });

  }, [shouldPrefetch, queryClient]);
}

/**
 * Background cache warming for better performance
 */
export function useBackgroundCacheWarming() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Warm cache in idle time (after 2 seconds)
    const timer = setTimeout(() => {
      // Warm up car brands if not already cached
      if (!queryClient.getQueryData(CAR_DATA_KEYS.brands)) {
        queryClient.prefetchQuery({
          queryKey: CAR_DATA_KEYS.brands,
          queryFn: async () => {
            const { data } = await supabase
              .from('car_brands')
              .select('*')
              .order('name')
              .limit(50); // Only top 50 for background warming
            return data || [];
          },
          staleTime: 30 * 60 * 1000, // 30 minutes for background data
        });
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [queryClient]);
}