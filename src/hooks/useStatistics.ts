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
        
        try {
          // Use only Edge Function for better performance and consistency
          const { data, error } = await supabase.functions.invoke('public-statistics');
          
          if (!error && data) {
            // Validate and normalize the received data
            const validatedData: Statistics = {
              totalSellers: Number(data.totalSellers) || 0,
              totalProducts: Number(data.totalProducts) || 0,
              lastOrderNumber: Number(data.lastOrderNumber) || 0
            };
            
            console.log('✅ Statistics fetched and validated from Edge Function:', validatedData);
            setCachedStats(validatedData);
            return validatedData;
          } else {
            console.warn('⚠️ Edge Function error, returning cached/fallback data:', error);
            throw new Error(`Edge Function failed: ${error?.message || 'Unknown error'}`);
          }
        } catch (error) {
          console.error('❌ Statistics fetch failed:', error);
          // Return cached data or fallback - don't try multiple endpoints
          const cached = getCachedStats();
          return cached || FALLBACK_STATS;
        }
        
      } catch (error) {
        console.warn('📊 Statistics fetch completely failed, using cached/fallback data:', error);
        return cachedStats || FALLBACK_STATS;
      }
    },
    retry: (failureCount, error) => {
      // Only retry on network errors, not auth errors
      return failureCount < 1 && !error?.message?.includes('auth');
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    // Longer cache times for mobile networks
    staleTime: isCellular ? 15 * 60 * 1000 : 10 * 60 * 1000, // 15/10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour in cache for better offline experience
    refetchInterval: false, // Disable auto-refetch, use manual invalidation
    placeholderData: cachedStats || FALLBACK_STATS, // Always have data to render
    // Enhanced error recovery for public endpoint
    networkMode: 'offlineFirst',
  });
};