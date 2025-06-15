
import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounceValue } from './useDebounceValue';

interface UseProductsFiltersProps {
  initialFilters?: {
    status?: string;
    sellerId?: string;
  };
}

export const useProductsFilters = ({
  initialFilters = {}
}: UseProductsFiltersProps = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Состояние поиска управляется здесь, инициализируется из URL
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const debouncedSearchTerm = useDebounceValue(searchTerm, 300);
  const isSearching = searchTerm !== debouncedSearchTerm;

  // Состояния фильтров берутся из URL
  const statusFilter = searchParams.get('status') || 'all';
  const sellerFilter = searchParams.get('seller') || 'all';
  
  const updateSearchTerm = setSearchTerm;

  // Эффект для синхронизации поиска с URL
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

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const clearFilters = useCallback(() => {
    clearSearch();
    setSearchParams({}, { replace: true });
  }, [clearSearch, setSearchParams]);

  const hasActiveSearch = useMemo(() => debouncedSearchTerm.trim().length > 0, [debouncedSearchTerm]);

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
