import { useQuery, UseQueryOptions } from '@tanstack/react-query';

/**
 * Optimized React Query hook with better default settings
 * for improved performance and user experience
 */
export function useOptimizedQuery<TQueryFnData = unknown, TError = Error, TData = TQueryFnData>(
  options: UseQueryOptions<TQueryFnData, TError, TData>
) {
  return useQuery({
    staleTime: 60000, // 1 minute - data is fresh for 1 minute
    gcTime: 300000, // 5 minutes - keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Reduce unnecessary network requests
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors or client errors (4xx)
      if (error?.status >= 400 && error?.status < 500) return false;
      return failureCount < 2; // Retry max 2 times for other errors
    },
    ...options,
    // Enable keepPreviousData for better UX during refetches
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Profile-specific optimized query hook
 */
export function useOptimizedProfileQuery<TData = any>(
  options: UseQueryOptions<any, Error, TData>
) {
  return useOptimizedQuery({
    staleTime: 300000, // 5 minutes - profiles don't change often
    gcTime: 600000, // 10 minutes - keep profiles in cache longer
    ...options,
  });
}
