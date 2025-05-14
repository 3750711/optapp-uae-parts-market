import { useState, useEffect } from 'react';
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
  
  // Basic filter state
  const [sortField, setSortField] = useState<'created_at' | 'price' | 'title' | 'status'>('status');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Load saved preferences from localStorage on component mount
  useEffect(() => {
    try {
      const savedSortField = localStorage.getItem(SORT_FIELD_KEY) as 'created_at' | 'price' | 'title' | 'status' | null;
      const savedSortOrder = localStorage.getItem(SORT_ORDER_KEY) as 'asc' | 'desc' | null;
      
      if (savedSortField) {
        setSortField(savedSortField);
      }
      
      if (savedSortOrder) {
        setSortOrder(savedSortOrder);
      }
    } catch (error) {
      console.error('Ошибка при загрузке настроек сортировки:', error);
    }
  }, []);
  
  // Save sort preferences to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(SORT_FIELD_KEY, sortField);
      localStorage.setItem(SORT_ORDER_KEY, sortOrder);
    } catch (error) {
      console.error('Ошибка при сохранении настроек сортировки:', error);
    }
  }, [sortField, sortOrder]);

  // Reset all filters - simplified
  const resetAllFilters = () => {
    // No filters to reset, but keeping the function for API compatibility
    onApplyFilters();
  };

  return {
    sortField,
    sortOrder,
    setSortField,
    setSortOrder,
    resetAllFilters
  };
};

export default useProductFilters;
