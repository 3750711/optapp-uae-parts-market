import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useCallback, useMemo } from 'react';
import { logger } from '@/utils/logger';

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

  // Загрузка всех брендов с AbortController
  const {
    data: allBrands,
    isLoading: isLoadingBrands,
    error: brandsError
  } = useQuery<CarBrand[]>({
    queryKey: ['car-data', 'brands'],
    queryFn: async ({ signal }) => {
      logger.log('🔍 Загрузка всех марок автомобилей из базы данных');
      const { data, error } = await supabase
        .from('car_brands')
        .select('id, name')
        .order('name', { ascending: true })
        .abortSignal(signal);
      
      if (error) {
        logger.error('❌ Ошибка загрузки марок автомобилей:', error);
        throw error;
      }
      
      logger.log('✅ Загружено марок:', data?.length);
      return data || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    gcTime: 30 * 60 * 1000, // 30 minutes in memory
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error?.message?.includes('40')) return false;
      return failureCount < 3;
    }
  });

  // Загрузка моделей для выбранного бренда с AbortController
  const {
    data: brandModelsForSelected,
    isLoading: isLoadingModels,
    error: modelsError
  } = useQuery<CarModel[]>({
    queryKey: ['car-data', 'models', selectedBrandId],
    queryFn: async ({ signal }) => {
      if (!selectedBrandId) return [];
      
      logger.log('🔍 Загрузка моделей для бренда:', { brandId: selectedBrandId });
      
      const { data, error } = await supabase
        .from('car_models')
        .select('id, name, brand_id')
        .eq('brand_id', selectedBrandId)
        .order('name', { ascending: true })
        .abortSignal(signal);
      
      if (error) {
        logger.error('❌ Ошибка загрузки моделей автомобилей:', error);
        throw error;
      }
      
      logger.log('✅ Загружено моделей:', data?.length);
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!selectedBrandId,
    retry: (failureCount, error) => {
      if (error?.message?.includes('40')) return false;
      return failureCount < 3;
    }
  });

  // Загрузка всех моделей для совместимости с AbortController
  const {
    data: allModels,
    isLoading: isLoadingAllModels
  } = useQuery<CarModel[]>({
    queryKey: ['car-data', 'all-models'],
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .from('car_models')
        .select('id, name, brand_id')
        .order('name', { ascending: true })
        .abortSignal(signal);
      
      if (error) {
        logger.error('❌ Ошибка загрузки всех моделей автомобилей:', error);
        throw error;
      }
      
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (error?.message?.includes('40')) return false;
      return failureCount < 3;
    }
  });

  const brands = useMemo(() => {
    const brandList = allBrands || [];
    if (!brandSearchTerm) return brandList;
    return brandList.filter(brand =>
      brand.name.toLowerCase().includes(brandSearchTerm.toLowerCase())
    );
  }, [allBrands, brandSearchTerm]);
  
  const brandModels = useMemo(() => {
    const modelList = brandModelsForSelected || [];
    if (!modelSearchTerm) return modelList;
    return modelList.filter(model =>
        model.name.toLowerCase().includes(modelSearchTerm.toLowerCase())
    );
  }, [brandModelsForSelected, modelSearchTerm]);

  const findBrandNameById = useCallback((brandId: string | null): string | null => {
    if (!brandId || !allBrands) return null;
    return allBrands.find(brand => brand.id === brandId)?.name || null;
  }, [allBrands]);

  const findModelNameById = useCallback((modelId: string | null): string | null => {
    if (!modelId || !allModels) return null;
    return allModels.find(model => model.id === modelId)?.name || null;
  }, [allModels]);

  const findBrandIdByName = useCallback((brandName: string | null): string | null => {
    if (!brandName || !allBrands) return null;
    return allBrands.find(brand => brand.name.toLowerCase() === brandName.toLowerCase())?.id || null;
  }, [allBrands]);

  const findModelIdByName = useCallback((modelName: string | null): string | null => {
    if (!modelName || !allModels) return null;
    return allModels.find(model => model.name.toLowerCase() === modelName.toLowerCase())?.id || null;
  }, [allModels]);

  const validateModelBrand = useCallback((modelId: string, brandId: string): boolean => {
    if (!allModels) return false;
    const model = allModels.find(m => m.id === modelId);
    return model?.brand_id === brandId;
  }, [allModels]);

  return {
    brands: brands || [],
    brandModels: brandModels || [],
    allModels: allModels || [],
    isLoading: isLoadingBrands || isLoadingModels || isLoadingAllModels,
    brandsError,
    modelsError,
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
    totalBrands: allBrands?.length || 0,
    totalModels: brandModelsForSelected?.length || 0,
    filteredBrandsCount: brands.length,
    filteredModelsCount: brandModels.length,
  };
};
