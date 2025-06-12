
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDebounceValue } from './useDebounceValue';

interface SearchState {
  searchTerm: string;
  debouncedSearchTerm: string;
  isSearching: boolean;
}

interface UseOptimizedProductsSearchProps {
  initialSearchTerm?: string;
  debounceDelay?: number;
}

export const useOptimizedProductsSearch = ({
  initialSearchTerm = '',
  debounceDelay = 300
}: UseOptimizedProductsSearchProps = {}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const debouncedSearchTerm = useDebounceValue(searchTerm, debounceDelay);
  const [isSearching, setIsSearching] = useState(false);

  // Определяем, идет ли поиск
  useEffect(() => {
    const searching = searchTerm !== debouncedSearchTerm && searchTerm.length > 0;
    setIsSearching(searching);
  }, [searchTerm, debouncedSearchTerm]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const updateSearchTerm = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  // Мемоизируем состояние для избежания лишних ререндеров
  const searchState = useMemo((): SearchState => ({
    searchTerm,
    debouncedSearchTerm,
    isSearching
  }), [searchTerm, debouncedSearchTerm, isSearching]);

  return {
    ...searchState,
    updateSearchTerm,
    clearSearch,
    hasActiveSearch: debouncedSearchTerm.trim().length > 0
  };
};
