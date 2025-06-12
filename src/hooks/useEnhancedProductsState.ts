
import { useProductsQuery } from './useProductsQuery';
import { useSellersQuery } from './useSellersQuery';
import { useProductsFilters } from './useProductsFilters';
import { useProductsSelection } from './useProductsSelection';

interface UseEnhancedProductsStateProps {
  pageSize?: number;
  initialFilters?: {
    status?: string;
    sellerId?: string;
  };
}

const PAGE_SIZE = 12;

export const useEnhancedProductsState = ({
  pageSize = PAGE_SIZE,
  initialFilters = {}
}: UseEnhancedProductsStateProps = {}) => {
  
  // Filters and search state
  const {
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
  } = useProductsFilters({ initialFilters });

  // Products query
  const {
    products,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useProductsQuery({
    debouncedSearchTerm,
    statusFilter,
    sellerFilter,
    pageSize
  });

  // Sellers query
  const {
    data: allSellers = [],
    isLoading: isSellersLoading
  } = useSellersQuery();

  // Selection state
  const { selectedProducts, setSelectedProducts } = useProductsSelection();

  return {
    // Products data
    products,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    
    // Search state
    searchTerm,
    debouncedSearchTerm,
    isSearching,
    updateSearchTerm,
    clearSearch,
    hasActiveSearch,
    
    // Filters state
    statusFilter,
    setStatusFilter,
    sellerFilter,
    setSellerFilter,
    
    // Sellers data
    allSellers,
    isSellersLoading,
    
    // Selection state
    selectedProducts,
    setSelectedProducts,
    
    // Utility functions
    clearFilters,
    hasActiveFilters
  };
};
