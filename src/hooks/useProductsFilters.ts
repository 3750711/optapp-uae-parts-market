
import { useState, useCallback, useMemo } from 'react';
import { useOptimizedProductsSearch } from './useOptimizedProductsSearch';

interface UseProductsFiltersProps {
  initialFilters?: {
    status?: string;
    sellerId?: string;
  };
}

export const useProductsFilters = ({
  initialFilters = {}
}: UseProductsFiltersProps = {}) => {
  // Инициализируем состояние безопасно
  const [statusFilter, setStatusFilter] = useState(() => initialFilters.status || 'all');
  const [sellerFilter, setSellerFilter] = useState(() => initialFilters.sellerId || 'all');

  const {
    searchTerm,
    debouncedSearchTerm,
    isSearching,
    updateSearchTerm,
    clearSearch,
    hasActiveSearch
  } = useOptimizedProductsSearch({
    debounceDelay: 300
  });

  const clearFilters = useCallback(() => {
    clearSearch();
    setStatusFilter('all');
    setSellerFilter('all');
  }, [clearSearch]);

  const hasActiveFilters = useMemo(() => {
    return hasActiveSearch || 
           statusFilter !== 'all' || 
           sellerFilter !== 'all';
  }, [hasActiveSearch, statusFilter, sellerFilter]);

  return {
    // Search state
    searchTerm,
    debouncedSearchTerm,
    isSearching,
    updateSearchTerm,
    clearSearch,
    hasActiveSearch,
    
    // Filter state
    statusFilter,
    setStatusFilter,
    sellerFilter,
    setSellerFilter,
    
    // Utility functions
    clearFilters,
    hasActiveFilters
  };
};
