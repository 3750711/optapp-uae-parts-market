
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
  onSearchChange?: (term: string) => void;
}

export const useOptimizedProductsSearch = ({
  initialSearchTerm = '',
  debounceDelay = 300,
  onSearchChange
}: UseOptimizedProductsSearchProps = {}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const debouncedSearchTerm = useDebounceValue(searchTerm, debounceDelay);
  const [isSearching, setIsSearching] = useState(false);

  // Определяем, идет ли поиск
  useEffect(() => {
    const searching = searchTerm !== debouncedSearchTerm && searchTerm.length > 0;
    console.log('🔍 Search state update:', { 
      searchTerm, 
      debouncedSearchTerm, 
      searching 
    });
    setIsSearching(searching);
  }, [searchTerm, debouncedSearchTerm]);

  // Уведомляем о изменении поискового запроса
  useEffect(() => {
    console.log('🔍 Debounced search term changed:', debouncedSearchTerm);
    if (onSearchChange) {
      onSearchChange(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, onSearchChange]);

  const clearSearch = useCallback(() => {
    console.log('🧹 Clearing search term');
    setSearchTerm('');
  }, []);

  const updateSearchTerm = useCallback((term: string) => {
    console.log('📝 Updating search term:', term);
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
