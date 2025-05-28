
import { useState, useRef, useCallback } from 'react';

interface SearchCacheEntry<T> {
  data: T[];
  timestamp: number;
}

interface UseSearchCacheProps {
  cacheTimeout?: number; // время жизни кэша в миллисекундах
}

export const useSearchCache = <T>({ cacheTimeout = 5 * 60 * 1000 }: UseSearchCacheProps = {}) => {
  const cache = useRef<Map<string, SearchCacheEntry<T>>>(new Map());

  const getCachedData = useCallback((key: string): T[] | null => {
    const entry = cache.current.get(key);
    if (!entry) return null;
    
    const isExpired = Date.now() - entry.timestamp > cacheTimeout;
    if (isExpired) {
      cache.current.delete(key);
      return null;
    }
    
    return entry.data;
  }, [cacheTimeout]);

  const setCachedData = useCallback((key: string, data: T[]) => {
    cache.current.set(key, {
      data,
      timestamp: Date.now()
    });
  }, []);

  const clearCache = useCallback(() => {
    cache.current.clear();
  }, []);

  return {
    getCachedData,
    setCachedData,
    clearCache
  };
};
