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
    
    // Only allow valid sort fields (status and price)
    const validSortField = savedSortField === 'status' || savedSortField === 'price' 
      ? savedSortField 
      : defaultSortField;
    
    // Always use these defaults if nothing is saved
    return {
      sortField: validSortField,
      sortOrder: (savedSortOrder as 'asc' | 'desc') || defaultSortOrder,
      filters: [...initialFilters]
    };
  };
  
  const [filterState, setFilterState] = useState<ProductFiltersProps>(getInitialState);
  
  useEffect(() => {
    // Логируем текущее состояние при инициализации
    console.log('useProductFilters initialized with:', {
      sortField: filterState.sortField,
      sortOrder: filterState.sortOrder,
      fromLocalStorage: {
        field: localStorage.getItem('admin_products_sort_field'),
        order: localStorage.getItem('admin_products_sort_order')
      }
    });
    
    // Это специально запускается только при монтировании
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
    // Only allow status or price as sort fields
    if (field !== 'status' && field !== 'price') {
      console.warn('Invalid sort field:', field, 'Only status and price are allowed');
      return;
    }

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
