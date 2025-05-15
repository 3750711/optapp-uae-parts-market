
import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";

export interface FiltersState {
  // Empty interface since we removed filters
}

export interface ProductFiltersReturn {
  sortField: 'created_at' | 'price' | 'title' | 'status';
  sortOrder: 'asc' | 'desc';
  setSortField: (field: 'created_at' | 'price' | 'title' | 'status') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  resetAllFilters: () => void;
}

// Constants for storing sort preferences in localStorage
const SORT_FIELD_KEY = 'admin_products_sort_field';
const SORT_ORDER_KEY = 'admin_products_sort_order';

export const useProductFilters = (
  products: any[] = [],
  onApplyFilters: () => void
): ProductFiltersReturn => {
  const { toast } = useToast();
  
  // Force "status-asc" default for pending first sorting
  const getInitialSortField = (): 'created_at' | 'price' | 'title' | 'status' => {
    try {
      // Clear stale values on first load to ensure default behavior
      const savedField = localStorage.getItem(SORT_FIELD_KEY);
      
      if (!savedField) {
        // If no saved value, set default and save it
        localStorage.setItem(SORT_FIELD_KEY, 'status');
        return 'status';
      }
      
      return savedField as 'created_at' | 'price' | 'title' | 'status';
    } catch {
      // On error, ensure we still use the default
      return 'status';
    }
  };
  
  const getInitialSortOrder = (): 'asc' | 'desc' => {
    try {
      // Clear stale values on first load
      const savedOrder = localStorage.getItem(SORT_ORDER_KEY);
      
      if (!savedOrder) {
        // If no saved value, set default and save it
        localStorage.setItem(SORT_ORDER_KEY, 'asc');
        return 'asc';
      }
      
      return savedOrder as 'asc' | 'desc';
    } catch {
      // On error, ensure we still use the default
      return 'asc';
    }
  };
  
  // Setup initial state with values from localStorage or defaults
  const [sortField, setSortFieldState] = useState<'created_at' | 'price' | 'title' | 'status'>(getInitialSortField);
  const [sortOrder, setSortOrderState] = useState<'asc' | 'desc'>(getInitialSortOrder);

  // Log the initial sort parameters for debugging
  useEffect(() => {
    console.log('Initial sort parameters:', { 
      sortField, 
      sortOrder,
      fromLocalStorage: {
        field: localStorage.getItem(SORT_FIELD_KEY),
        order: localStorage.getItem(SORT_ORDER_KEY)
      }
    });
  }, []);

  // Memoized functions for setting sort with onApplyFilters callback
  const setSortField = useCallback((field: 'created_at' | 'price' | 'title' | 'status') => {
    console.log('Setting sort field:', field);
    setSortFieldState(field);
    try {
      localStorage.setItem(SORT_FIELD_KEY, field);
      // Call the function to update data when sorting changes
      onApplyFilters();
    } catch (error) {
      console.error('Error saving sort settings:', error);
    }
  }, [onApplyFilters]);
  
  const setSortOrder = useCallback((order: 'asc' | 'desc') => {
    console.log('Setting sort order:', order);
    setSortOrderState(order);
    try {
      localStorage.setItem(SORT_ORDER_KEY, order);
      // Call the function to update data when sorting changes
      onApplyFilters();
    } catch (error) {
      console.error('Error saving sort settings:', error);
    }
  }, [onApplyFilters]);

  // Reset all filters - simplified
  const resetAllFilters = useCallback(() => {
    console.log('Resetting filters to defaults: status-asc');
    // Set to default values
    setSortFieldState('status');
    setSortOrderState('asc');
    
    try {
      // Update localStorage
      localStorage.setItem(SORT_FIELD_KEY, 'status');
      localStorage.setItem(SORT_ORDER_KEY, 'asc');
    } catch (error) {
      console.error('Error resetting sort settings:', error);
    }
    
    onApplyFilters();
  }, [onApplyFilters]);

  return {
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    resetAllFilters
  };
};

export default useProductFilters;
