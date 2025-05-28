
import { useMemo, useState, useCallback } from 'react';
import { useDebounceSearch } from './useDebounceSearch';
import { useSearchCache } from './useSearchCache';

interface SearchableItem {
  id: string;
  name: string;
}

interface UseEnhancedSearchProps<T extends SearchableItem> {
  items: T[];
  searchTerm: string;
  filterFn?: (item: T, searchTerm: string) => boolean;
  popularItems?: string[]; // IDs of popular items to show first
  cacheKey?: string; // ключ для кэширования
}

export const useEnhancedSearch = <T extends SearchableItem>({
  items,
  searchTerm,
  filterFn,
  popularItems = [],
  cacheKey
}: UseEnhancedSearchProps<T>) => {
  const debouncedSearch = useDebounceSearch(searchTerm, 300);
  const [isLoading, setIsLoading] = useState(false);
  const { getCachedData, setCachedData } = useSearchCache<T>({ cacheTimeout: 10 * 60 * 1000 });
  
  const defaultFilterFn = useCallback((item: T, search: string) => 
    item.name.toLowerCase().includes(search.toLowerCase()), 
    []
  );

  const filteredItems = useMemo(() => {
    // Показываем состояние загрузки только если есть поисковый запрос и он еще не обработан
    const shouldShowLoading = searchTerm !== debouncedSearch && debouncedSearch !== '';
    setIsLoading(shouldShowLoading);

    if (!debouncedSearch) {
      setIsLoading(false);
      // Группируем популярные элементы вверху когда нет поиска
      if (popularItems.length > 0) {
        const popular = items.filter(item => popularItems.includes(item.id));
        const regular = items.filter(item => !popularItems.includes(item.id));
        return [...popular, ...regular];
      }
      return items;
    }

    // Проверяем кэш
    const cacheKeyForSearch = cacheKey ? `${cacheKey}_${debouncedSearch}` : null;
    if (cacheKeyForSearch) {
      const cachedResults = getCachedData(cacheKeyForSearch);
      if (cachedResults) {
        setIsLoading(false);
        return cachedResults;
      }
    }

    const filtered = items.filter(item => 
      (filterFn || defaultFilterFn)(item, debouncedSearch)
    );

    // Даже в результатах поиска показываем популярные элементы первыми
    let result: T[];
    if (popularItems.length > 0) {
      const popular = filtered.filter(item => popularItems.includes(item.id));
      const regular = filtered.filter(item => !popularItems.includes(item.id));
      result = [...popular, ...regular];
    } else {
      result = filtered;
    }

    // Сохраняем в кэш
    if (cacheKeyForSearch) {
      setCachedData(cacheKeyForSearch, result);
    }

    setIsLoading(false);
    return result;
  }, [items, debouncedSearch, searchTerm, filterFn, defaultFilterFn, popularItems, cacheKey, getCachedData, setCachedData]);

  return {
    filteredItems,
    debouncedSearch,
    resultCount: filteredItems.length,
    hasResults: filteredItems.length > 0,
    isSearching: searchTerm !== debouncedSearch,
    isLoading,
    isEmpty: debouncedSearch !== '' && filteredItems.length === 0
  };
};
