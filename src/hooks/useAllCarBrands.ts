
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState, useCallback } from 'react';

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

  // Загрузка всех брендов
  const {
    data: brands,
    isLoading: isLoadingBrands,
    error: brandsError
  } = useQuery<CarBrand[]>({
    queryKey: ['admin-all-car-brands'],
    queryFn: async () => {
      console.log('🔍 Загрузка всех марок автомобилей из базы данных');
      const { data, error } = await supabase
        .from('car_brands')
        .select('id, name')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('❌ Ошибка загрузки марок автомобилей:', error);
        throw error;
      }
      
      console.log('✅ Загружено марок:', data?.length);
      return data || [];
    },
    staleTime: Infinity, // Кэшируем данные на все время сессии
  });

  // Загрузка всех моделей для выбранного бренда
  const {
    data: brandModels,
    isLoading: isLoadingModels,
    error: modelsError
  } = useQuery<CarModel[]>({
    queryKey: ['admin-all-car-models', selectedBrandId],
    queryFn: async () => {
      if (!selectedBrandId) return [];
      
      console.log('🔍 Загрузка моделей для бренда:', { brandId: selectedBrandId });
      
      const { data, error } = await supabase
        .from('car_models')
        .select('id, name, brand_id')
        .eq('brand_id', selectedBrandId)
        .order('name', { ascending: true });
      
      if (error) {
        console.error('❌ Ошибка загрузки моделей автомобилей:', error);
        throw error;
      }
      
      console.log('✅ Загружено моделей:', data?.length);
      return data || [];
    },
    staleTime: Infinity,
    enabled: !!selectedBrandId,
  });

  // Загрузка всех моделей для совместимости (парсинг заголовка, валидация)
  const {
    data: allModels,
    isLoading: isLoadingAllModels
  } = useQuery<CarModel[]>({
    queryKey: ['admin-all-models'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('car_models')
        .select('id, name, brand_id')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('❌ Ошибка загрузки всех моделей автомобилей:', error);
        throw error;
      }
      
      return data || [];
    },
    staleTime: Infinity,
  });

  const findBrandNameById = useCallback((brandId: string | null): string | null => {
    if (!brandId || !brands) return null;
    return brands.find(brand => brand.id === brandId)?.name || null;
  }, [brands]);

  const findModelNameById = useCallback((modelId: string | null): string | null => {
    if (!modelId || !brandModels) return null;
    return brandModels.find(model => model.id === modelId)?.name || null;
  }, [brandModels]);

  const findBrandIdByName = useCallback((brandName: string | null): string | null => {
    if (!brandName || !brands) return null;
    return brands.find(brand => brand.name.toLowerCase() === brandName.toLowerCase())?.id || null;
  }, [brands]);

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
    findBrandIdByName,
    findModelIdByName,
    findBrandNameById,
    findModelNameById,
    validateModelBrand,
  };
};
