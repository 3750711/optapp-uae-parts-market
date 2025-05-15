
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
  
  // Чтение из localStorage только при инициализации
  const getInitialSortField = (): 'created_at' | 'price' | 'title' | 'status' => {
    try {
      const saved = localStorage.getItem(SORT_FIELD_KEY);
      return saved ? saved as 'created_at' | 'price' | 'title' | 'status' : 'status';
    } catch {
      return 'status';
    }
  };
  
  const getInitialSortOrder = (): 'asc' | 'desc' => {
    try {
      const saved = localStorage.getItem(SORT_ORDER_KEY);
      return saved ? saved as 'asc' | 'desc' : 'asc';
    } catch {
      return 'asc';
    }
  };
  
  // Basic filter state с начальными значениями из localStorage
  const [sortField, setSortFieldState] = useState<'created_at' | 'price' | 'title' | 'status'>(getInitialSortField);
  const [sortOrder, setSortOrderState] = useState<'asc' | 'desc'>(getInitialSortOrder);

  // Мемоизированные функции установки сортировки с вызовом onApplyFilters
  const setSortField = useCallback((field: 'created_at' | 'price' | 'title' | 'status') => {
    setSortFieldState(field);
    try {
      localStorage.setItem(SORT_FIELD_KEY, field);
      // Вызываем функцию обновления данных при изменении сортировки
      onApplyFilters();
    } catch (error) {
      console.error('Ошибка при сохранении настроек сортировки:', error);
    }
  }, [onApplyFilters]);
  
  const setSortOrder = useCallback((order: 'asc' | 'desc') => {
    setSortOrderState(order);
    try {
      localStorage.setItem(SORT_ORDER_KEY, order);
      // Вызываем функцию обновления данных при изменении сортировки
      onApplyFilters();
    } catch (error) {
      console.error('Ошибка при сохранении настроек сортировки:', error);
    }
  }, [onApplyFilters]);

  // Reset all filters - simplified
  const resetAllFilters = useCallback(() => {
    // No filters to reset, but keeping the function for API compatibility
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
