import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCounts } from './fetchCounts';

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
      const cached = localStorage.getItem('counts_cache');
      return cached ? JSON.parse(cached) : { parts: 0, orders: 0 };
    },
  });

  // Cache successful results using useEffect pattern
  React.useEffect(() => {
    if (query.data && query.isSuccess) {
      localStorage.setItem('counts_cache', JSON.stringify(query.data));
    }
  }, [query.data, query.isSuccess]);

  return query;
}