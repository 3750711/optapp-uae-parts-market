
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

  // Функции для поиска ID по названию (для Telegram парсера)
  const findBrandIdByName = useCallback((brandName: string): string | null => {
    if (!brandName || !brands.length) return null;
    const normalizedSearchName = brandName.toLowerCase().trim();
    
    console.log('🔍 Поиск бренда по названию:', brandName, 'среди', brands.length, 'брендов');
    
    const found = brands.find(brand => 
      brand.name.toLowerCase().trim() === normalizedSearchName
    );
    
    if (found) {
      console.log('✅ Найден бренд:', found.name, 'ID:', found.id);
      return found.id;
    }
    
    console.log('❌ Бренд не найден:', brandName);
    return null;
  }, [brands]);

  const findModelIdByName = useCallback((modelName: string, brandId: string): string | null => {
    if (!modelName || !brandId || !models.length) return null;
    const normalizedSearchName = modelName.toLowerCase().trim();
    
    console.log('🔍 Поиск модели по названию:', modelName, 'для бренда:', brandId, 'среди', models.length, 'моделей');
    
    const found = models.find(model => 
      model.brand_id === brandId && 
      model.name.toLowerCase().trim() === normalizedSearchName
    );
    
    if (found) {
      console.log('✅ Найдена модель:', found.name, 'ID:', found.id);
      return found.id;
    }
    
    console.log('❌ Модель не найдена:', modelName, 'для бренда:', brandId);
    return null;
  }, [models]);

  // Прямой поиск модели в базе данных (для избежания проблем с асинхронной загрузкой)
  const findModelIdByNameDirect = useCallback(async (modelName: string, brandId: string): Promise<string | null> => {
    if (!modelName || !brandId) return null;
    
    const normalizedSearchName = modelName.toLowerCase().trim();
    console.log('🔍 Прямой поиск модели в базе:', modelName, 'для бренда:', brandId);
    
    try {
      const { data, error } = await supabase
        .from('car_models')
        .select('id, name')
        .eq('brand_id', brandId)
        .ilike('name', normalizedSearchName)
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('❌ Ошибка поиска модели:', error);
        return null;
      }
      
      if (data) {
        console.log('✅ Найдена модель в базе:', data.name, 'ID:', data.id);
        return data.id;
      }
      
      console.log('❌ Модель не найдена в базе:', modelName);
      return null;
    } catch (error) {
      console.error('❌ Ошибка поиска модели в базе:', error);
      return null;
    }
  }, []);

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
    findBrandIdByName,
    findModelIdByName,
    findModelIdByNameDirect,
    shouldLoadBrands
  };
};
