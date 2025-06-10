
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
  models: Model[], // Уже отфильтрованные модели для выбранного бренда
  searchBrandTerm: string,
  searchModelTerm: string
) => {
  // Популярные бренды
  const popularBrandIds = useMemo(() => {
    const popularBrands = [
      "toyota", "honda", "ford", "chevrolet", "nissan", 
      "hyundai", "kia", "volkswagen", "bmw", "mercedes-benz"
    ];
    
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

  const modelSearch = useEnhancedSearch({
    items: models || [],
    searchTerm: searchModelTerm
  });

  return {
    filteredBrands: brandSearch.filteredItems,
    filteredModels: modelSearch.filteredItems,
    brandResultCount: brandSearch.resultCount,
    modelResultCount: modelSearch.resultCount,
    hasValidBrands: brands && brands.length > 0,
    hasValidModels: models && models.length > 0
  };
};
