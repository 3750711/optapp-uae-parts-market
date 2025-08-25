
import React from 'react';
import EnhancedInstantSearch from './search/EnhancedInstantSearch';
import EnhancedSearchResults from './search/EnhancedSearchResults';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { useSearchHistory } from '@/hooks/useSearchHistory';

interface CatalogSearchAndFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeSearchTerm: string;
  onSearchSubmit: (e: React.FormEvent) => void;
  hideSoldProducts: boolean;
  setHideSoldProducts: (hide: boolean) => void;
  isSearching?: boolean;
  resultCount?: number;
}

const CatalogSearchAndFilters: React.FC<CatalogSearchAndFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  activeSearchTerm,
  onSearchSubmit,
  hideSoldProducts,
  setHideSoldProducts,
  isSearching = false,
  resultCount = 0
}) => {
  const { searchHistory } = useSearchHistory();
  
  // Popular searches based on auto parts
  const popularSearches = [
    'фары', 'бампер', 'двигатель', 'nissan', 'toyota', 'mazda',
    'коробка передач', 'стартер', 'генератор', 'амортизаторы'
  ];
  
  // Recent searches from history
  const recentSearches = searchHistory.map(item => item.query).slice(0, 5);

  return (
    <div className="space-y-4">
      <EnhancedInstantSearch
        searchQuery={searchTerm}
        setSearchQuery={setSearchTerm}
        handleSearchSubmit={onSearchSubmit}
        isSearching={isSearching}
        resultCount={resultCount}
        popularSearches={popularSearches}
        recentSearches={recentSearches}
      />
      
      <EnhancedSearchResults
        searchQuery={activeSearchTerm}
        resultCount={resultCount}
        isSearching={isSearching}
      />
      
      {/* Additional filters */}
      <Card className="p-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="hide-sold"
            checked={hideSoldProducts}
            onCheckedChange={setHideSoldProducts}
            className="h-4 w-4"
          />
          <label
            htmlFor="hide-sold"
            className="text-sm text-muted-foreground cursor-pointer select-none"
          >
            Скрыть проданные товары
          </label>
        </div>
      </Card>
    </div>
  );
};

export default CatalogSearchAndFilters;
