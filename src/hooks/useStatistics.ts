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
    queryKey: ['public-statistics'],
    queryFn: async (): Promise<Statistics> => {
      try {
        console.log('📊 Fetching statistics via public endpoint');
        
        // Try the public statistics edge function first (no auth required)
        try {
          const { data, error } = await supabase.functions.invoke('public-statistics');
          
          if (!error && data) {
            console.log('✅ Statistics fetched from public endpoint:', data);
            setCachedStats(data);
            return data;
          } else {
            console.warn('⚠️ Public statistics endpoint error:', error);
          }
        } catch (funcError) {
          console.warn('⚠️ Edge function call failed:', funcError);
        }

        // Fallback to direct RPC call
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc('get_public_statistics');
          
          if (!rpcError && rpcData) {
            console.log('✅ Statistics fetched from RPC:', rpcData);
            setCachedStats(rpcData);
            return rpcData;
          } else {
            console.warn('⚠️ RPC statistics error:', rpcError);
          }
        } catch (rpcError) {
          console.warn('⚠️ RPC call failed:', rpcError);
        }

        // Final fallback - use cached or default data
        console.warn('📊 Using fallback statistics data');
        return cachedStats || FALLBACK_STATS;
        
      } catch (error) {
        console.warn('📊 Statistics fetch completely failed, using cached/fallback data:', error);
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
    staleTime: isCellular ? 15 * 60 * 1000 : 10 * 60 * 1000, // Longer cache on cellular
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
    refetchInterval: false, // Disable auto-refetch, use manual invalidation
    placeholderData: cachedStats || FALLBACK_STATS, // Always have data to render
    // Enhanced error recovery for public endpoint
    networkMode: 'offlineFirst',
  });
};