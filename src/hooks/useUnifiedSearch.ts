import { useMemo } from 'react';
import { useDebounceSearch } from './useDebounceSearch';

interface UnifiedSearchResult {
  searchTerm: string;
  debouncedSearchTerm: string;
  searchConditions: {
    textSearch: string | null;
    lotNumber: number | null;
    placeNumber: number | null;
    optIdSearch: string | null;
  };
  hasActiveSearch: boolean;
}

export const useUnifiedSearch = (searchInput: string): UnifiedSearchResult => {
  const debouncedSearchTerm = useDebounceSearch(searchInput, 500);
  
  const searchConditions = useMemo(() => {
    const trimmed = debouncedSearchTerm.trim();
    
    if (!trimmed) {
      return {
        textSearch: null,
        lotNumber: null,
        placeNumber: null,
        optIdSearch: null,
      };
    }
    
    // Check if it's an OPT ID (format: OPT-xxx or optxxx)
    const optIdPattern = /^(opt-?)?(\d+)$/i;
    const optMatch = trimmed.match(optIdPattern);
    if (optMatch) {
      return {
        textSearch: null,
        lotNumber: null,
        placeNumber: null,
        optIdSearch: `OPT-${optMatch[2]}`,
      };
    }
    
    // Check if it's a pure number (could be lot or place number)
    const numberPattern = /^\d+$/;
    if (numberPattern.test(trimmed)) {
      const number = parseInt(trimmed);
      return {
        textSearch: null,
        lotNumber: number,
        placeNumber: number,
        optIdSearch: null,
      };
    }
    
    // Default to text search
    return {
      textSearch: trimmed,
      lotNumber: null,
      placeNumber: null,
      optIdSearch: null,
    };
  }, [debouncedSearchTerm]);
  
  const hasActiveSearch = Boolean(searchConditions.textSearch || 
                                  searchConditions.lotNumber || 
                                  searchConditions.placeNumber || 
                                  searchConditions.optIdSearch);
  
  return {
    searchTerm: searchInput,
    debouncedSearchTerm,
    searchConditions,
    hasActiveSearch,
  };
};