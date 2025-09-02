import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { isLikelyCellularSlow } from '@/utils/netProfile';

interface Statistics {
  totalProducts: number;
  lastOrderNumber: number;
  totalSellers: number;
}

const FALLBACK_STATS: Statistics = {
  totalProducts: 1373,
  lastOrderNumber: 7774,
  totalSellers: 156,
};

const CACHE_KEY = 'statistics-cache';

// Get cached stats from localStorage
const getCachedStats = (): Statistics | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

// Cache stats to localStorage
const setCachedStats = (stats: Statistics) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(stats));
  } catch {
    // Ignore storage errors
  }
};

export const useStatistics = () => {
  const cachedStats = getCachedStats();
  const isCellular = isLikelyCellularSlow();
  
  return useQuery({
    queryKey: ['statistics'],
    queryFn: async (): Promise<Statistics> => {
      try {
        let totalProducts = 0;
        let lastOrderNumber = 0;
        let totalSellers = 0;

        if (isCellular) {
          // Sequential requests for cellular networks to avoid overwhelming
          try {
            const { count } = await supabase
              .from('products')
              .select('*', { count: 'planned', head: true });
            totalProducts = count || 0;
          } catch (error) {
            console.warn('Failed to fetch products count:', error);
            totalProducts = cachedStats?.totalProducts || FALLBACK_STATS.totalProducts;
          }

          try {
            const { data: lastOrder } = await supabase
              .from('orders')
              .select('order_number')
              .order('order_number', { ascending: false })
              .limit(1)
              .maybeSingle();
            lastOrderNumber = lastOrder?.order_number || 0;
          } catch (error) {
            console.warn('Failed to fetch last order:', error);
            lastOrderNumber = cachedStats?.lastOrderNumber || FALLBACK_STATS.lastOrderNumber;
          }

          try {
            const { count } = await supabase
              .from('profiles')
              .select('*', { count: 'planned', head: true })
              .eq('user_type', 'seller');
            totalSellers = count || 0;
          } catch (error) {
            console.warn('Failed to fetch sellers count:', error);
            totalSellers = cachedStats?.totalSellers || FALLBACK_STATS.totalSellers;
          }
        } else {
          // Parallel requests for good connections
          const [productsResult, ordersResult, sellersResult] = await Promise.allSettled([
            supabase.from('products').select('*', { count: 'planned', head: true }),
            supabase.from('orders').select('order_number').order('order_number', { ascending: false }).limit(1).maybeSingle(),
            supabase.from('profiles').select('*', { count: 'planned', head: true }).eq('user_type', 'seller')
          ]);

          totalProducts = productsResult.status === 'fulfilled' 
            ? productsResult.value.count || 0 
            : cachedStats?.totalProducts || FALLBACK_STATS.totalProducts;

          lastOrderNumber = ordersResult.status === 'fulfilled' 
            ? ordersResult.value.data?.order_number || 0 
            : cachedStats?.lastOrderNumber || FALLBACK_STATS.lastOrderNumber;

          totalSellers = sellersResult.status === 'fulfilled' 
            ? sellersResult.value.count || 0 
            : cachedStats?.totalSellers || FALLBACK_STATS.totalSellers;
        }

        const stats = { totalProducts, lastOrderNumber, totalSellers };
        setCachedStats(stats);
        return stats;
      } catch (error) {
        console.warn('Statistics fetch failed, using cached/fallback data:', error);
        return cachedStats || FALLBACK_STATS;
      }
    },
    retry: (failureCount, error) => {
      // Only retry on network errors, not on logical errors (406, etc)
      const isNetworkError = error instanceof Error && 
        (error.message.includes('NetworkError') || 
         error.message.includes('Failed to fetch') ||
         error.message.includes('CORS'));
      return isNetworkError && failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime: isCellular ? 10 * 60 * 1000 : 5 * 60 * 1000, // Longer cache on cellular
    gcTime: 20 * 60 * 1000, // 20 minutes garbage collection
    refetchInterval: false, // Disable auto-refetch, use manual invalidation
    placeholderData: cachedStats || FALLBACK_STATS, // Always have data to render
  });
};