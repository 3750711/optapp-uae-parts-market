
import React from 'react';
import SimpleSearchBar from './SimpleSearchBar';
import { Checkbox } from '@/components/ui/checkbox';

interface CatalogSearchAndFiltersProps {
  searchTerm: string;
  onSearch: (query: string) => void;
  hideSoldProducts: boolean;
  setHideSoldProducts: (hide: boolean) => void;
  isSearching?: boolean;
}

const CatalogSearchAndFilters: React.FC<CatalogSearchAndFiltersProps> = ({
  searchTerm,
  onSearch,
  hideSoldProducts,
  setHideSoldProducts,
  isSearching = false
}) => {
  return (
    <div className="space-y-3">
      <SimpleSearchBar
        initialQuery={searchTerm}
        onSubmit={onSearch}
        isSearching={isSearching}
      />
      
      {/* Compact hide sold products filter */}
      <div className="flex items-center justify-center sm:justify-start">
        <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-background/50 hover:bg-background/80 transition-colors duration-200 border border-border/50">
          <Checkbox
            id="hide-sold"
            checked={hideSoldProducts}
            onCheckedChange={setHideSoldProducts}
            className="h-3.5 w-3.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <label
            htmlFor="hide-sold"
            className="text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors duration-200"
          >
            Скрыть проданные
          </label>
        </div>
      </div>
    </div>
  );
};

export default CatalogSearchAndFilters;
