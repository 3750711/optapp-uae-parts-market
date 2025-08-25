
import React from 'react';
import SimpleSearch from './SimpleSearch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';

interface CatalogSearchAndFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSearch: (query: string) => void;
  hideSoldProducts: boolean;
  setHideSoldProducts: (hide: boolean) => void;
  isSearching?: boolean;
}

const CatalogSearchAndFilters: React.FC<CatalogSearchAndFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  onSearch,
  hideSoldProducts,
  setHideSoldProducts,
  isSearching = false
}) => {
  return (
    <div className="space-y-4">
      <SimpleSearch
        searchQuery={searchTerm}
        setSearchQuery={setSearchTerm}
        onSearch={onSearch}
        isSearching={isSearching}
        placeholder="Поиск автозапчастей по названию, марке, модели..."
      />
      
      {/* Hide sold products filter */}
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
