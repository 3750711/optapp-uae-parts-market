
import { useMemo } from 'react';
import { useEnhancedSearch } from './useEnhancedSearch';
import { usePersistedSearch } from './usePersistedSearch';

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
  externalBrandTerm?: string,
  externalModelTerm?: string,
  watchBrandId?: string
) => {
  // Используем персистентный поиск, но позволяем внешнее управление
  const { searchTerm: persistedBrandTerm, setSearchTerm: setPersistentBrandTerm } = usePersistedSearch({ 
    key: 'brand_search' 
  });
  const { searchTerm: persistedModelTerm, setSearchTerm: setPersistentModelTerm } = usePersistedSearch({ 
    key: 'model_search' 
  });

  // Используем внешние значения если они переданы, иначе персистентные
  const brandSearchTerm = externalBrandTerm !== undefined ? externalBrandTerm : persistedBrandTerm;
  const modelSearchTerm = externalModelTerm !== undefined ? externalModelTerm : persistedModelTerm;

  // Популярные бренды с улучшенной группировкой
  const popularBrands = [
    "toyota", "honda", "ford", "chevrolet", "nissan", 
    "hyundai", "kia", "volkswagen", "bmw", "mercedes-benz",
    "audi", "lexus", "mazda", "subaru", "mitsubishi"
  ];

  const popularBrandIds = brands
    .filter(brand => popularBrands.includes(brand.name.toLowerCase()))
    .map(brand => brand.id);

  const brandSearch = useEnhancedSearch({
    items: brands,
    searchTerm: brandSearchTerm,
    popularItems: popularBrandIds,
    cacheKey: 'brands'
  });

  // Модели для выбранного бренда
  const brandFilteredModels = useMemo(() => {
    return brandModels.filter(model => model.brand_id === watchBrandId);
  }, [brandModels, watchBrandId]);

  const modelSearch = useEnhancedSearch({
    items: brandFilteredModels,
    searchTerm: modelSearchTerm,
    cacheKey: watchBrandId ? `models_${watchBrandId}` : 'models'
  });

  return {
    filteredBrands: brandSearch.filteredItems,
    filteredModels: modelSearch.filteredItems,
    brandResultCount: brandSearch.resultCount,
    modelResultCount: modelSearch.resultCount,
    debouncedBrandSearch: brandSearch.debouncedSearch,
    debouncedModelSearch: modelSearch.debouncedSearch,
    isBrandSearching: brandSearch.isSearching,
    isModelSearching: modelSearch.isSearching,
    isBrandLoading: brandSearch.isLoading,
    isModelLoading: modelSearch.isLoading,
    isBrandEmpty: brandSearch.isEmpty,
    isModelEmpty: modelSearch.isEmpty,
    // Функции для управления персистентным поиском
    setBrandSearchTerm: setPersistentBrandTerm,
    setModelSearchTerm: setPersistentModelTerm
  };
};
