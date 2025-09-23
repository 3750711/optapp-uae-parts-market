
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounceValue } from './useDebounce';

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

  // Состояние поиска и фильтров теперь полностью управляется URL
  const searchTerm = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || 'all';
  const sellerFilter = searchParams.get('seller') || 'all';

  // Дебаунс применяется к значению из URL для запросов к API
  const debouncedSearchTerm = useDebounceValue(searchTerm, 500);
  const isSearching = searchTerm !== debouncedSearchTerm;

  // Функция для обновления поискового запроса в URL
  const updateSearchTerm = useCallback((term: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (term) {
        newParams.set('search', term);
      } else {
        newParams.delete('search');
      }
      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  // Функция для обновления фильтра статуса в URL
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

  // Функция для обновления фильтра продавца в URL
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

  // Очистка поиска
  const clearSearch = useCallback(() => {
    updateSearchTerm('');
  }, [updateSearchTerm]);

  // Очистка всех фильтров
  const clearFilters = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  // Мемоизированные значения для определения активных фильтров
  const hasActiveSearch = useMemo(() => searchTerm.trim().length > 0, [searchTerm]);

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
