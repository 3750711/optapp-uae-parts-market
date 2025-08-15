
import React from 'react';
import SimplifiedSearchBar from './SimplifiedSearchBar';

interface CatalogSearchAndFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeSearchTerm: string;
  onSearchSubmit: (e: React.FormEvent) => void;
  hideSoldProducts: boolean;
  setHideSoldProducts: (hide: boolean) => void;
  isAISearching?: boolean;
  searchType?: 'ai' | 'fallback' | null;
  selectedBrand?: string;
  selectedModel?: string;
  brands?: { id: string; name: string }[];
  brandModels?: { id: string; name: string }[];
  onBrandChange?: (brandId: string, brandName: string) => void;
  onModelChange?: (modelId: string, modelName: string) => void;
  onClearBrandModel?: () => void;
  findBrandNameById?: (brandId: string | null) => string | null;
  findModelNameById?: (modelId: string | null) => string | null;
}

const CatalogSearchAndFilters: React.FC<CatalogSearchAndFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  activeSearchTerm,
  onSearchSubmit,
  hideSoldProducts,
  setHideSoldProducts,
  isAISearching = false,
  searchType = null,
  selectedBrand,
  selectedModel,
  brands,
  brandModels,
  onBrandChange,
  onModelChange,
  onClearBrandModel,
  findBrandNameById,
  findModelNameById
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
        searchType={searchType}
        selectedBrand={selectedBrand}
        selectedModel={selectedModel}
        brands={brands}
        brandModels={brandModels}
        onBrandChange={onBrandChange}
        onModelChange={onModelChange}
        onClearBrandModel={onClearBrandModel}
        findBrandNameById={findBrandNameById}
        findModelNameById={findModelNameById}
      />
      
    </div>
  );
};

export default CatalogSearchAndFilters;
