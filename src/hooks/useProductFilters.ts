import { useState, useEffect, useCallback } from 'react';

// Define the FiltersState interface that was missing
export interface FiltersState {
  // Keep it empty for now as it seems this is how it's being used
  // Can be extended later if needed
}

interface ProductFiltersProps {
  sortField: string;
  sortOrder: 'asc' | 'desc';
  filters: Record<string, any>[];
}

/**
 * Hook to manage product filters and sorting
 * @param initialFilters - Initial filters array
 * @param onFiltersChange - Callback when filters change
 * @returns Filters and sort state and handlers
 */
export const useProductFilters = (
  initialFilters: Record<string, any>[] = [], 
  onFiltersChange?: () => void
) => {
  // Default values - sorted by status with pending first
  const defaultSortField = 'status';
  const defaultSortOrder = 'asc';
  
  // Initialize with saved values or defaults
  const getInitialState = () => {
    // Check for stored values in localStorage
    const savedSortField = localStorage.getItem('admin_products_sort_field');
    const savedSortOrder = localStorage.getItem('admin_products_sort_order');
    
    // Always use these defaults if nothing is saved
    return {
      sortField: savedSortField || defaultSortField,
      sortOrder: (savedSortOrder as 'asc' | 'desc') || defaultSortOrder,
      filters: [...initialFilters]
    };
  };
  
  const [filterState, setFilterState] = useState<ProductFiltersProps>(getInitialState);
  
  // Force setting initial default values on first load
  useEffect(() => {
    // Force clear localStorage on initial mount and set our defaults
    localStorage.setItem('admin_products_sort_field', defaultSortField);
    localStorage.setItem('admin_products_sort_order', defaultSortOrder);
    
    setFilterState(prev => ({
      ...prev,
      sortField: defaultSortField,
      sortOrder: defaultSortOrder
    }));
    
    // This is intentionally only run on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update localStorage whenever sort changes
  useEffect(() => {
    localStorage.setItem('admin_products_sort_field', filterState.sortField);
    localStorage.setItem('admin_products_sort_order', filterState.sortOrder);
    
    console.log('Current sort settings:', { 
      sortField: filterState.sortField, 
      sortOrder: filterState.sortOrder 
    });
  }, [filterState.sortField, filterState.sortOrder]);

  // Callbacks to update filter state
  const addFilter = useCallback((filter: Record<string, any>) => {
    setFilterState(prev => {
      const newFilters = [...prev.filters, filter];
      if (onFiltersChange) onFiltersChange();
      return { ...prev, filters: newFilters };
    });
  }, [onFiltersChange]);

  const removeFilter = useCallback((filterKey: string) => {
    setFilterState(prev => {
      const newFilters = prev.filters.filter(f => !Object.keys(f).includes(filterKey));
      if (onFiltersChange) onFiltersChange();
      return { ...prev, filters: newFilters };
    });
  }, [onFiltersChange]);

  const setSortField = useCallback((field: string) => {
    console.log('Setting sort field:', field);
    setFilterState(prev => {
      if (onFiltersChange) onFiltersChange();
      return { ...prev, sortField: field };
    });
  }, [onFiltersChange]);

  const setSortOrder = useCallback((order: 'asc' | 'desc') => {
    console.log('Setting sort order:', order);
    setFilterState(prev => {
      if (onFiltersChange) onFiltersChange();
      return { ...prev, sortOrder: order };
    });
  }, [onFiltersChange]);

  const resetAllFilters = useCallback(() => {
    console.log('Resetting all filters to defaults');
    localStorage.removeItem('admin_products_sort_field');
    localStorage.removeItem('admin_products_sort_order');
    
    setFilterState({
      sortField: defaultSortField,
      sortOrder: defaultSortOrder,
      filters: []
    });
    
    if (onFiltersChange) onFiltersChange();
  }, [defaultSortField, defaultSortOrder, onFiltersChange]);

  return {
    filters: filterState.filters,
    sortField: filterState.sortField,
    sortOrder: filterState.sortOrder,
    addFilter,
    removeFilter,
    setSortField,
    setSortOrder,
    resetAllFilters
  };
};
