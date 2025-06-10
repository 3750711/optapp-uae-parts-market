
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
  selectedBrandId: string // Используем напрямую brandId из формы
) => {
  // Популярные бренды
  const popularBrands = [
    "toyota", "honda", "ford", "chevrolet", "nissan", 
    "hyundai", "kia", "volkswagen", "bmw", "mercedes-benz"
  ];

  const popularBrandIds = useMemo(() => {
    if (!brands || brands.length === 0) return [];
    return brands
      .filter(brand => popularBrands.includes(brand.name.toLowerCase()))
      .map(brand => brand.id);
  }, [brands]);

  const brandSearch = useEnhancedSearch({
    items: brands || [],
    searchTerm: searchBrandTerm,
    popularItems: popularBrandIds
  });

  // Модели для выбранного бренда - используем selectedBrandId напрямую
  const brandFilteredModels = useMemo(() => {
    if (!brandModels || brandModels.length === 0 || !selectedBrandId) {
      return [];
    }
    return brandModels.filter(model => model.brand_id === selectedBrandId);
  }, [brandModels, selectedBrandId]);

  const modelSearch = useEnhancedSearch({
    items: brandFilteredModels,
    searchTerm: searchModelTerm
  });

  return {
    filteredBrands: brandSearch.filteredItems,
    filteredModels: modelSearch.filteredItems,
    brandResultCount: brandSearch.resultCount,
    modelResultCount: modelSearch.resultCount,
    isBrandSearching: brandSearch.isSearching,
    isModelSearching: modelSearch.isSearching,
    hasValidBrands: brands && brands.length > 0,
    hasValidModels: brandFilteredModels.length > 0
  };
};
