import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CarBrand {
  id: string;
  name: string;
}

interface CarModel {
  id: string;
  name: string;
  brand_id: string;
}

export const useLazyCarBrands = () => {
  const [shouldLoadBrands, setShouldLoadBrands] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');

  // Lazy load brands only when needed
  const { 
    data: brands = [], 
    isLoading: isLoadingBrands,
    error: brandsError 
  } = useQuery({
    queryKey: ['car-brands-lazy'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('car_brands')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data as CarBrand[];
    },
    enabled: shouldLoadBrands,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Lazy load models for selected brand
  const { 
    data: brandModels = [], 
    isLoading: isLoadingModels,
    error: modelsError 
  } = useQuery({
    queryKey: ['car-models-lazy', selectedBrandId],
    queryFn: async () => {
      if (!selectedBrandId) return [];
      
      const { data, error } = await supabase
        .from('car_models')
        .select('id, name, brand_id')
        .eq('brand_id', selectedBrandId)
        .order('name');
      
      if (error) throw error;
      return data as CarModel[];
    },
    enabled: !!selectedBrandId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 45 * 60 * 1000, // 45 minutes
  });

  // Cache all models for title parsing (load only when needed)
  const [shouldLoadAllModels, setShouldLoadAllModels] = useState(false);
  const { 
    data: allModels = [], 
    isLoading: isLoadingAllModels 
  } = useQuery({
    queryKey: ['all-car-models-lazy'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('car_models')
        .select('id, name, brand_id')
        .order('name');
      
      if (error) throw error;
      return data as CarModel[];
    },
    enabled: shouldLoadAllModels,
    staleTime: 20 * 60 * 1000, // 20 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });

  // Utility functions
  const enableBrandsLoading = useCallback(() => {
    setShouldLoadBrands(true);
  }, []);

  const enableAllModelsLoading = useCallback(() => {
    setShouldLoadAllModels(true);
  }, []);

  const selectBrand = useCallback((brandId: string) => {
    setSelectedBrandId(brandId);
  }, []);

  const findBrandNameById = useCallback((brandId: string | null): string | null => {
    if (!brandId || !shouldLoadBrands) return null;
    const brand = brands.find(b => b.id === brandId);
    return brand?.name || null;
  }, [brands, shouldLoadBrands]);

  const findModelNameById = useCallback((modelId: string | null): string | null => {
    if (!modelId) return null;
    const model = brandModels.find(m => m.id === modelId) || 
                  allModels.find(m => m.id === modelId);
    return model?.name || null;
  }, [brandModels, allModels]);

  const findBrandIdByName = useCallback((brandName: string | null): string | null => {
    if (!brandName || !shouldLoadBrands) return null;
    const brand = brands.find(b => 
      b.name.toLowerCase() === brandName.toLowerCase()
    );
    return brand?.id || null;
  }, [brands, shouldLoadBrands]);

  const findModelIdByName = useCallback((modelName: string | null): string | null => {
    if (!modelName) return null;
    
    // Search in brandModels first (for current brand)
    let model = brandModels.find(m => 
      m.name.toLowerCase() === modelName.toLowerCase()
    );
    
    // Fallback to allModels if available
    if (!model && shouldLoadAllModels) {
      model = allModels.find(m => 
        m.name.toLowerCase() === modelName.toLowerCase()
      );
    }
    
    return model?.id || null;
  }, [brandModels, allModels, shouldLoadAllModels]);

  const validateModelBrand = useCallback((modelId: string, brandId: string): boolean => {
    if (!modelId || !brandId) return false;
    
    const model = brandModels.find(m => m.id === modelId) || 
                  allModels.find(m => m.id === modelId);
    
    return model?.brand_id === brandId;
  }, [brandModels, allModels]);

  const isLoading = useMemo(() => {
    return (shouldLoadBrands && isLoadingBrands) || 
           (selectedBrandId && isLoadingModels) || 
           (shouldLoadAllModels && isLoadingAllModels);
  }, [shouldLoadBrands, isLoadingBrands, selectedBrandId, isLoadingModels, shouldLoadAllModels, isLoadingAllModels]);

  const hasError = useMemo(() => {
    return brandsError || modelsError;
  }, [brandsError, modelsError]);

  return {
    // Data
    brands,
    brandModels,
    allModels,
    selectedBrandId,
    
    // Loading states
    isLoading,
    isLoadingBrands,
    isLoadingModels,
    isLoadingAllModels,
    hasError,
    
    // Control functions
    enableBrandsLoading,
    enableAllModelsLoading,
    selectBrand,
    
    // Utility functions
    findBrandNameById,
    findModelNameById,
    findBrandIdByName,
    findModelIdByName,
    validateModelBrand,
    
    // State flags
    shouldLoadBrands,
    shouldLoadAllModels
  };
};