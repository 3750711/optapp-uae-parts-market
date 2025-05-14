import { useState, useEffect } from 'react';
import { DateRange } from '@/components/admin/filters/DateRangeFilter';
import { useToast } from "@/components/ui/use-toast";

export interface FiltersState {
  priceRange: [number, number] | null;
  dateRange: DateRange | null;
  status: string | null;
}

export interface ProductFiltersReturn {
  filters: FiltersState;
  searchTerm: string;
  activeSearchTerm: string;
  sortField: 'created_at' | 'price' | 'title' | 'status';
  sortOrder: 'asc' | 'desc';
  priceRange: [number, number];
  dateRange: DateRange;
  statusFilter: string | null;
  maxPrice: number;
  setSearchTerm: (term: string) => void;
  setActiveSearchTerm: (term: string) => void;
  setSortField: (field: 'created_at' | 'price' | 'title' | 'status') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setPriceRange: (range: [number, number]) => void;
  setDateRange: (range: DateRange) => void;
  setStatusFilter: (status: string | null) => void;
  setMaxPrice: (price: number) => void;
  handleSearch: () => void;
  handleClearSearch: () => void;
  resetAllFilters: () => void;
  applyFilters: () => void;
  updateFilters: () => void;
}

// Constants for storing sort preferences in localStorage
const SORT_FIELD_KEY = 'admin_products_sort_field';
const SORT_ORDER_KEY = 'admin_products_sort_order';

// Улучшенная функция для очистки поискового запроса от специальных символов
const sanitizeSearchTerm = (term: string): string => {
  // Заменяем потенциально опасные символы на пробелы
  return term.replace(/['";\\%]/g, ' ').trim();
};

export const useProductFilters = (
  products: any[] = [],
  onSearch: () => void,
  onClearSearch: () => void,
  onApplyFilters: () => void
): ProductFiltersReturn => {
  const { toast } = useToast();
  
  // Basic filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeSearchTerm, setActiveSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<'created_at' | 'price' | 'title' | 'status'>('status');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Advanced filter states
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  
  // Combined filters state
  const [filters, setFilters] = useState<FiltersState>({
    priceRange: null,
    dateRange: null,
    status: null
  });

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

  // Calculate max price from products for the price slider
  useEffect(() => {
    if (products.length > 0) {
      const prices = products.map(p => parseFloat(p.price)).filter(Boolean);
      if (prices.length > 0) {
        const max = Math.max(...prices, 1000);
        setMaxPrice(max);
        setPriceRange([0, max]);
      }
    }
  }, [products]);

  // Update filters when individual filter values change
  const updateFilters = () => {
    setFilters({
      priceRange: priceRange[0] === 0 && priceRange[1] === maxPrice ? null : priceRange,
      dateRange: dateRange.from || dateRange.to ? dateRange : null,
      status: statusFilter
    });
  };

  // Update filters when component values change
  useEffect(() => {
    updateFilters();
  }, [priceRange, dateRange, statusFilter, maxPrice]);

  // Search handler
  const handleSearch = () => {
    console.log('handleSearch вызван с термином:', searchTerm);
    
    // Очистка и валидация поискового запроса
    const searchTermTrimmed = searchTerm.trim();
    
    if (!searchTermTrimmed) {
      if (activeSearchTerm) {
        setActiveSearchTerm('');
        toast({
          title: "Поиск сброшен",
          description: "Отображены все товары",
          duration: 3000
        });
        onClearSearch();
      }
      return;
    }
    
    // Sanitize the search term
    const validatedSearchTerm = sanitizeSearchTerm(searchTermTrimmed);
    
    if (validatedSearchTerm !== searchTermTrimmed) {
      toast({
        title: "Внимание",
        description: "Некоторые специальные символы были заменены в поисковом запросе",
        duration: 3000
      });
    }
    
    if (activeSearchTerm !== validatedSearchTerm) {
      console.log('Устанавливаем новый активный поисковый термин:', validatedSearchTerm);
      setActiveSearchTerm(validatedSearchTerm);
      
      // Показываем уведомление о начале поиска
      toast({
        title: "Поиск",
        description: `Поиск по запросу: ${validatedSearchTerm}`,
        duration: 3000
      });
      
      onSearch();
    } else {
      console.log('Поисковый термин не изменился, запрос не будет выполнен');
    }
  };

  // Clear search handler
  const handleClearSearch = () => {
    if (activeSearchTerm !== '') {
      console.log('Сброс поискового запроса');
      setSearchTerm('');
      setActiveSearchTerm('');
      
      toast({
        title: "Поиск сброшен",
        description: "Отображены все товары",
        duration: 3000
      });
      
      onClearSearch();
    }
  };

  // Reset all filters
  const resetAllFilters = () => {
    console.log('Сброс всех фильтров');
    setPriceRange([0, maxPrice]);
    setDateRange({ from: null, to: null });
    setStatusFilter(null);
    setFilters({
      priceRange: null,
      dateRange: null,
      status: null
    });
    
    toast({
      title: "Фильтры сброшены",
      description: "Все фильтры были сброшены",
      duration: 3000
    });
    
    onApplyFilters();
  };

  // Apply filters handler
  const applyFilters = () => {
    console.log('Применение фильтров');
    updateFilters();
    
    const filtersApplied = [];
    if (filters.priceRange) filtersApplied.push("цена");
    if (filters.dateRange) filtersApplied.push("дата");
    if (filters.status) filtersApplied.push("статус");
    
    if (filtersApplied.length > 0) {
      toast({
        title: "Фильтры применены",
        description: `Применены фильтры: ${filtersApplied.join(", ")}`,
        duration: 3000
      });
    }
    
    onApplyFilters();
  };

  return {
    filters,
    searchTerm,
    activeSearchTerm,
    sortField,
    sortOrder,
    priceRange,
    dateRange,
    statusFilter,
    maxPrice,
    setSearchTerm,
    setActiveSearchTerm,
    setSortField,
    setSortOrder,
    setPriceRange,
    setDateRange,
    setStatusFilter,
    setMaxPrice,
    handleSearch,
    handleClearSearch,
    resetAllFilters,
    applyFilters,
    updateFilters
  };
};

export default useProductFilters;
