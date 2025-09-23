import { useOptimizedCarBrands, useOptimizedCarModels } from './useOptimizedCarData';
import { useState, useCallback, useMemo } from 'react';

export interface CarBrand {
  id: string;
  name: string;
}

export interface CarModel {
  id: string;
  name: string;
  brand_id: string;
}

export const useAllCarBrands = () => {
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [brandSearchTerm, setBrandSearchTerm] = useState('');
  const [modelSearchTerm, setModelSearchTerm] = useState('');

  // Use optimized car brands hook with unified cache key
  const brandsQuery = useOptimizedCarBrands();
  const allBrands = brandsQuery.data || [];
  
  // Optimized models query with AbortController
  const modelsQuery = useOptimizedCarModels(selectedBrandId || undefined);
  const brandModelsForSelected = modelsQuery.data || [];

  // Get all models for compatibility
  const allModelsQuery = useOptimizedCarModels();
  const allModels = allModelsQuery.data || [];

  const brands = useMemo(() => {
    if (!brandSearchTerm) return allBrands;
    return allBrands.filter(brand =>
      brand.name.toLowerCase().includes(brandSearchTerm.toLowerCase())
    );
  }, [allBrands, brandSearchTerm]);
  
  const brandModels = useMemo(() => {
    if (!modelSearchTerm) return brandModelsForSelected;
    return brandModelsForSelected.filter(model =>
        model.name.toLowerCase().includes(modelSearchTerm.toLowerCase())
    );
  }, [brandModelsForSelected, modelSearchTerm]);

  const findBrandNameById = useCallback((brandId: string | null): string | null => {
    if (!brandId) return null;
    return allBrands.find(brand => brand.id === brandId)?.name || null;
  }, [allBrands]);

  const findModelNameById = useCallback((modelId: string | null): string | null => {
    if (!modelId) return null;
    return allModels.find(model => model.id === modelId)?.name || null;
  }, [allModels]);

  const findBrandIdByName = useCallback((brandName: string | null): string | null => {
    if (!brandName) return null;
    return allBrands.find(brand => brand.name.toLowerCase() === brandName.toLowerCase())?.id || null;
  }, [allBrands]);

  const findModelIdByName = useCallback((modelName: string | null): string | null => {
    if (!modelName) return null;
    return allModels.find(model => model.name.toLowerCase() === modelName.toLowerCase())?.id || null;
  }, [allModels]);

  const validateModelBrand = useCallback((modelId: string, brandId: string): boolean => {
    const model = allModels.find(m => m.id === modelId);
    return model?.brand_id === brandId;
  }, [allModels]);

  return {
    brands,
    brandModels,
    allModels,
    isLoading: brandsQuery.isLoading || modelsQuery.isLoading || allModelsQuery.isLoading,
    brandsError: brandsQuery.error,
    modelsError: modelsQuery.error,
    selectBrand: setSelectedBrandId,
    selectedBrand: selectedBrandId,
    findBrandIdByName,
    findModelIdByName,
    findBrandNameById,
    findModelNameById,
    validateModelBrand,
    brandSearchTerm,
    setBrandSearchTerm,
    modelSearchTerm,
    setModelSearchTerm,
    totalBrands: allBrands.length,
    totalModels: brandModelsForSelected.length,
    filteredBrandsCount: brands.length,
    filteredModelsCount: brandModels.length,
  };
};
