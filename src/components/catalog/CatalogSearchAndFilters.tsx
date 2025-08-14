
import React from 'react';
import SimplifiedSearchBar from './SimplifiedSearchBar';
import SearchTypeIndicator from './SearchTypeIndicator';

interface CatalogSearchAndFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeSearchTerm: string;
  onSearchSubmit: (e: React.FormEvent) => void;
  hideSoldProducts: boolean;
  setHideSoldProducts: (hide: boolean) => void;
  isAISearching?: boolean;
}

const CatalogSearchAndFilters: React.FC<CatalogSearchAndFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  activeSearchTerm,
  onSearchSubmit,
  hideSoldProducts,
  setHideSoldProducts,
  isAISearching = false
}) => {
  return (
    <div>
      <SimplifiedSearchBar
        searchQuery={searchTerm}
        setSearchQuery={setSearchTerm}
        handleSearchSubmit={onSearchSubmit}
        hideSoldProducts={hideSoldProducts}
        setHideSoldProducts={setHideSoldProducts}
        isAISearching={isAISearching}
      />
      
      {/* Search type indicator */}
      {activeSearchTerm && (
        <div className="flex justify-center mb-4">
          <SearchTypeIndicator searchTerm={activeSearchTerm} />
        </div>
      )}
    </div>
  );
};

export default CatalogSearchAndFilters;
