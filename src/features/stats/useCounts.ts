import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCounts } from './fetchCounts';
import { safeGetItem, safeSetItem } from '@/utils/localStorage';

export function useCounts() {
  const query = useQuery({
    queryKey: ['counts'],
    queryFn: fetchCounts,
    staleTime: 30_000, // 30 seconds
    retry: (failureCount, error: any) => {
      // Only retry network errors, max 2 attempts
      return /TypeError|NetworkError|timeout|Failed to fetch/i.test(error?.message || '') && failureCount < 2;
    },
    placeholderData: () => {
      // Return cached data as placeholder while loading
      return safeGetItem('counts_cache', { parts: 0, orders: 0 });
    },
  });

  // Cache successful results using useEffect pattern
  React.useEffect(() => {
    if (query.data && query.isSuccess) {
      safeSetItem('counts_cache', query.data);
    }
  }, [query.data, query.isSuccess]);

  return query;
}