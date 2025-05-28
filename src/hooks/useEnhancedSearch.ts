
import { useMemo, useState, useCallback } from 'react';
import { useDebounceSearch } from './useDebounceSearch';

interface SearchableItem {
  id: string;
  name: string;
}

interface UseEnhancedSearchProps<T extends SearchableItem> {
  items: T[];
  searchTerm: string;
  filterFn?: (item: T, searchTerm: string) => boolean;
  popularItems?: string[]; // IDs of popular items to show first
}

export const useEnhancedSearch = <T extends SearchableItem>({
  items,
  searchTerm,
  filterFn,
  popularItems = []
}: UseEnhancedSearchProps<T>) => {
  const debouncedSearch = useDebounceSearch(searchTerm, 300);
  
  const defaultFilterFn = useCallback((item: T, search: string) => 
    item.name.toLowerCase().includes(search.toLowerCase()), 
    []
  );

  const filteredItems = useMemo(() => {
    if (!debouncedSearch) {
      // Group popular items first when no search
      if (popularItems.length > 0) {
        const popular = items.filter(item => popularItems.includes(item.id));
        const regular = items.filter(item => !popularItems.includes(item.id));
        return [...popular, ...regular];
      }
      return items;
    }

    const filtered = items.filter(item => 
      (filterFn || defaultFilterFn)(item, debouncedSearch)
    );

    // Even in search results, show popular items first
    if (popularItems.length > 0) {
      const popular = filtered.filter(item => popularItems.includes(item.id));
      const regular = filtered.filter(item => !popularItems.includes(item.id));
      return [...popular, ...regular];
    }

    return filtered;
  }, [items, debouncedSearch, filterFn, defaultFilterFn, popularItems]);

  return {
    filteredItems,
    debouncedSearch,
    resultCount: filteredItems.length,
    hasResults: filteredItems.length > 0,
    isSearching: searchTerm !== debouncedSearch
  };
};
