
import { useProductsQueryRouter } from './useProductsQueryRouter';
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

export const useEnhancedProductsState = (props: UseEnhancedProductsStateProps = {}) => {
  const { pageSize = PAGE_SIZE, initialFilters = {} } = props;
  
  // Filters and search state - инициализируем первыми
  const filtersState = useProductsFilters({ initialFilters });
  
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
    notificationIssuesFilter,
    setNotificationIssuesFilter,
    clearFilters,
    hasActiveFilters
  } = filtersState;

  // Products query - используем роутер для выбора нужного хука
  const productsQuery = useProductsQueryRouter({
    debouncedSearchTerm,
    statusFilter,
    sellerFilter,
    notificationIssuesFilter,
    pageSize
  });

  const {
    products,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = productsQuery;

  // Sellers query
  const sellersQuery = useSellersQuery();
  const {
    data: allSellers = [],
    isLoading: isSellersLoading
  } = sellersQuery;

  // Selection state
  const selectionState = useProductsSelection();
  const { selectedProducts, setSelectedProducts } = selectionState;

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
    notificationIssuesFilter,
    setNotificationIssuesFilter,
    
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
