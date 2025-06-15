
import { useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useOptimizedProductsSearch } from './useOptimizedProductsSearch';

interface UseProductsFiltersProps {
  initialFilters?: {
    status?: string;
    sellerId?: string;
  };
}

export const useProductsFilters = ({
  // initialFilters is kept for signature compatibility but is unused.
  // URL is the single source of truth.
  initialFilters = {}
}: UseProductsFiltersProps = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const statusFilter = searchParams.get('status') || 'all';
  const sellerFilter = searchParams.get('seller') || 'all';
  const initialSearch = searchParams.get('search') || '';

  const {
    searchTerm,
    debouncedSearchTerm,
    isSearching,
    updateSearchTerm,
    clearSearch,
    hasActiveSearch
  } = useOptimizedProductsSearch({
    initialSearchTerm: initialSearch,
    debounceDelay: 300
  });

  const setStatusFilter = useCallback((status: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (status && status !== 'all') {
        newParams.set('status', status);
      } else {
        newParams.delete('status');
      }
      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  const setSellerFilter = useCallback((seller: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (seller && seller !== 'all') {
        newParams.set('seller', seller);
      } else {
        newParams.delete('seller');
      }
      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  useEffect(() => {
    const currentSearchInUrl = searchParams.get('search') || '';
    if (debouncedSearchTerm !== currentSearchInUrl) {
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        if (debouncedSearchTerm) {
          newParams.set('search', debouncedSearchTerm);
        } else {
          newParams.delete('search');
        }
        return newParams;
      }, { replace: true });
    }
  }, [debouncedSearchTerm, searchParams, setSearchParams]);

  const clearFilters = useCallback(() => {
    clearSearch();
    setSearchParams({}, { replace: true });
  }, [clearSearch, setSearchParams]);

  const hasActiveFilters = useMemo(() => {
    return hasActiveSearch ||
           statusFilter !== 'all' ||
           sellerFilter !== 'all';
  }, [hasActiveSearch, statusFilter, sellerFilter]);

  return {
    searchTerm,
    debouncedSearchTerm,
    isSearching,
    updateSearchTerm,
    clearSearch,
    hasActiveSearch,
    
    statusFilter,
    setStatusFilter,
    sellerFilter,
    setSellerFilter,
    
    clearFilters,
    hasActiveFilters
  };
};
