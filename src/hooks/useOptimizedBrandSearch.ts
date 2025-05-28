
import { useMemo } from 'react';
import { useEnhancedSearch } from './useEnhancedSearch';

interface Brand {
  id: string;
  name: string;
}

interface Model {
  id: string;
  name: string;
  brand_id: string;
}

export const useOptimizedBrandSearch = (
  brands: Brand[],
  brandModels: Model[],
  searchBrandTerm: string,
  searchModelTerm: string,
  watchBrandId: string
) => {
  // Популярные бренды
  const popularBrands = [
    "toyota", "honda", "ford", "chevrolet", "nissan", 
    "hyundai", "kia", "volkswagen", "bmw", "mercedes-benz"
  ];

  const popularBrandIds = brands
    .filter(brand => popularBrands.includes(brand.name.toLowerCase()))
    .map(brand => brand.id);

  const brandSearch = useEnhancedSearch({
    items: brands,
    searchTerm: searchBrandTerm,
    popularItems: popularBrandIds
  });

  // Модели для выбранного бренда
  const brandFilteredModels = useMemo(() => {
    return brandModels.filter(model => model.brand_id === watchBrandId);
  }, [brandModels, watchBrandId]);

  const modelSearch = useEnhancedSearch({
    items: brandFilteredModels,
    searchTerm: searchModelTerm
  });

  return {
    filteredBrands: brandSearch.filteredItems,
    filteredModels: modelSearch.filteredItems,
    brandResultCount: brandSearch.resultCount,
    modelResultCount: modelSearch.resultCount,
    debouncedBrandSearch: brandSearch.debouncedSearch,
    debouncedModelSearch: modelSearch.debouncedSearch,
    isBrandSearching: brandSearch.isSearching,
    isModelSearching: modelSearch.isSearching
  };
};
