
import React from 'react';
import SimplifiedSearchBar from './SimplifiedSearchBar';

interface CatalogSearchAndFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeSearchTerm: string;
  onSearchSubmit: (e: React.FormEvent) => void;
  hideSoldProducts: boolean;
  setHideSoldProducts: (hide: boolean) => void;
}

const CatalogSearchAndFilters: React.FC<CatalogSearchAndFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  activeSearchTerm,
  onSearchSubmit,
  hideSoldProducts,
  setHideSoldProducts
}) => {
  return (
    <div>
      <SimplifiedSearchBar
        searchQuery={searchTerm}
        setSearchQuery={setSearchTerm}
        handleSearchSubmit={onSearchSubmit}
        hideSoldProducts={hideSoldProducts}
        setHideSoldProducts={setHideSoldProducts}
      />
      
    </div>
  );
};

export default CatalogSearchAndFilters;
