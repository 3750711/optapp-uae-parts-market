
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CarBrand {
  id: string;
  name: string;
}

export interface CarModel {
  id: string;
  name: string;
  brand_id: string;
}

export const useLazyCarData = () => {
  const [shouldLoadBrands, setShouldLoadBrands] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);

  // Загрузка брендов только при необходимости
  const {
    data: brands = [],
    isLoading: isLoadingBrands
  } = useQuery<CarBrand[]>({
    queryKey: ['lazy-car-brands'],
    queryFn: async () => {
      console.log('🔍 Загрузка брендов автомобилей');
      const { data, error } = await supabase
        .from('car_brands')
        .select('id, name')
        .order('name', { ascending: true })
        .limit(100); // Ограничиваем количество для быстрой загрузки
      
      if (error) {
        console.error('❌ Ошибка загрузки брендов:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: shouldLoadBrands,
    staleTime: 5 * 60 * 1000, // Кэшируем на 5 минут
  });

  // Загрузка моделей только для выбранного бренда
  const {
    data: models = [],
    isLoading: isLoadingModels
  } = useQuery<CarModel[]>({
    queryKey: ['lazy-car-models', selectedBrandId],
    queryFn: async () => {
      if (!selectedBrandId) return [];
      
      console.log('🔍 Загрузка моделей для бренда:', selectedBrandId);
      const { data, error } = await supabase
        .from('car_models')
        .select('id, name, brand_id')
        .eq('brand_id', selectedBrandId)
        .order('name', { ascending: true })
        .limit(200);
      
      if (error) {
        console.error('❌ Ошибка загрузки моделей:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!selectedBrandId,
    staleTime: 5 * 60 * 1000,
  });

  const enableBrandsLoading = useCallback(() => {
    setShouldLoadBrands(true);
  }, []);

  const selectBrand = useCallback((brandId: string) => {
    setSelectedBrandId(brandId);
  }, []);

  const findBrandNameById = useCallback((brandId: string | null): string | null => {
    if (!brandId || !brands.length) return null;
    return brands.find(brand => brand.id === brandId)?.name || null;
  }, [brands]);

  const findModelNameById = useCallback((modelId: string | null): string | null => {
    if (!modelId || !models.length) return null;
    return models.find(model => model.id === modelId)?.name || null;
  }, [models]);

  return {
    brands,
    models,
    isLoadingBrands,
    isLoadingModels,
    selectedBrandId,
    enableBrandsLoading,
    selectBrand,
    findBrandNameById,
    findModelNameById,
    shouldLoadBrands
  };
};
