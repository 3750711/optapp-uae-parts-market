
import { useMemo } from 'react';
import { useDebounceSearch } from './useDebounceSearch';

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
  const debouncedBrandSearch = useDebounceSearch(searchBrandTerm, 300);
  const debouncedModelSearch = useDebounceSearch(searchModelTerm, 300);

  const filteredBrands = useMemo(() => {
    if (!debouncedBrandSearch) return brands;
    return brands.filter((brand) =>
      brand.name.toLowerCase().includes(debouncedBrandSearch.toLowerCase())
    );
  }, [brands, debouncedBrandSearch]);

  const filteredModels = useMemo(() => {
    // Сначала фильтруем модели по выбранному бренду
    const brandFilteredModels = brandModels.filter(
      (model) => model.brand_id === watchBrandId
    );

    // Затем применяем поиск
    if (!debouncedModelSearch) return brandFilteredModels;
    return brandFilteredModels.filter((model) =>
      model.name.toLowerCase().includes(debouncedModelSearch.toLowerCase())
    );
  }, [brandModels, watchBrandId, debouncedModelSearch]);

  return {
    filteredBrands,
    filteredModels,
    debouncedBrandSearch,
    debouncedModelSearch
  };
};
