import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 часа

// Функция для сохранения в localStorage
const saveToCache = (key: string, value: any) => {
  try {
    const item = {
      value,
      timestamp: Date.now(),
      version: 1
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.warn('Ошибка сохранения в localStorage:', error);
  }
};

// Функция для загрузки из localStorage
const loadFromCache = (key: string) => {
  try {
    const itemString = localStorage.getItem(key);
    if (!itemString) return null;
    
    const item = JSON.parse(itemString);
    
    if (item.version !== 1 || Date.now() - item.timestamp > CACHE_DURATION) {
      localStorage.removeItem(key);
      return null;
    }
    
    return item.value;
  } catch (error) {
    localStorage.removeItem(key);
    return null;
  }
};

export const useAllCarBrands = () => {
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [brandSearchTerm, setBrandSearchTerm] = useState('');
  const [modelSearchTerm, setModelSearchTerm] = useState('');

  // Загрузка всех брендов
  const {
    data: brandsData,
    isLoading: isLoadingBrands,
    error: brandsError,
    refetch: refetchBrands
  } = useQuery({
    queryKey: ['admin-all-car-brands'],
    queryFn: async () => {
      // Пытаемся загрузить из кэша
      const cached = loadFromCache('admin-all-car-brands');
      if (cached) {
        console.log('🗄️ Загружены все марки автомобилей из кэша для админки');
        return cached;
      }
      
      console.log('🔍 Загрузка всех марок автомобилей из базы данных для админки');
      
      const { data, error } = await supabase
        .from('car_brands')
        .select('id, name')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('❌ Ошибка загрузки марок автомобилей:', error);
        throw error;
      }
      
      // Кэшируем результат
      saveToCache('admin-all-car-brands', data);
      
      console.log('✅ Загружено марок для админки:', data?.length);
      return data || [];
    },
    staleTime: 15 * 60 * 1000, // 15 минут
    gcTime: 60 * 60 * 1000, // 1 час
  });

  // Загрузка всех моделей для выбранного бренда
  const {
    data: modelsData,
    isLoading: isLoadingModels,
    error: modelsError,
    refetch: refetchModels
  } = useQuery({
    queryKey: ['admin-all-car-models', selectedBrandId],
    queryFn: async () => {
      if (!selectedBrandId) return [];
      
      // Пытаемся загрузить из кэша
      const cacheKey = `admin-all-car-models-${selectedBrandId}`;
      const cached = loadFromCache(cacheKey);
      if (cached) {
        console.log('🗄️ Загружены все модели автомобилей из кэша для админки', { brandId: selectedBrandId });
        return cached;
      }
      
      console.log('🔍 Загрузка всех моделей автомобилей из базы данных для админки', { brandId: selectedBrandId });
      
      const { data, error } = await supabase
        .from('car_models')
        .select('id, name, brand_id')
        .eq('brand_id', selectedBrandId)
        .order('name', { ascending: true });
      
      if (error) {
        console.error('❌ Ошибка загрузки моделей автомобилей:', error);
        throw error;
      }
      
      // Кэшируем результат
      saveToCache(cacheKey, data);
      
      console.log('✅ Загружено моделей для админки:', data?.length);
      return data || [];
    },
    staleTime: 15 * 60 * 1000, // 15 минут
    gcTime: 60 * 60 * 1000, // 1 час
    enabled: !!selectedBrandId,
  });

  // Загрузка всех моделей для совместимости
  const {
    data: allModelsData,
    isLoading: isLoadingAllModels
  } = useQuery({
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
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const brandModelCounts = useMemo(() => {
    if (!allModelsData) return new Map<string, number>();
    return allModelsData.reduce((acc, model) => {
        const count = acc.get(model.brand_id) || 0;
        acc.set(model.brand_id, count + 1);
        return acc;
    }, new Map<string, number>());
  }, [allModelsData]);

  // Фильтрация брендов по поисковому запросу
  const filteredBrands = useMemo(() => {
    if (!brandsData) return [];
    
    if (!brandSearchTerm.trim()) return brandsData;
    
    return brandsData.filter(brand =>
      brand.name.toLowerCase().includes(brandSearchTerm.toLowerCase())
    );
  }, [brandsData, brandSearchTerm]);

  // Фильтрация моделей по поисковому запросу
  const filteredModels = useMemo(() => {
    if (!modelsData) return [];
    
    if (!modelSearchTerm.trim()) return modelsData;
    
    return modelsData.filter(model =>
      model.name.toLowerCase().includes(modelSearchTerm.toLowerCase())
    );
  }, [modelsData, modelSearchTerm]);

  // Функции для поиска по ID
  const findBrandNameById = useCallback((brandId: string | null): string | null => {
    if (!brandId || !brandsData) return null;
    const brand = brandsData.find(brand => brand.id === brandId);
    return brand?.name || null;
  }, [brandsData]);

  const findModelNameById = useCallback((modelId: string | null): string | null => {
    if (!modelId || !modelsData) return null;
    const model = modelsData.find(model => model.id === modelId);
    return model?.name || null;
  }, [modelsData]);

  // Функции для поиска по имени
  const findBrandIdByName = useCallback((brandName: string | null): string | null => {
    if (!brandName || !brandsData) return null;
    const brand = brandsData.find(brand => brand.name.toLowerCase() === brandName.toLowerCase());
    return brand?.id || null;
  }, [brandsData]);

  const findModelIdByName = useCallback((modelName: string | null): string | null => {
    if (!modelName || !allModelsData) return null;
    const model = allModelsData.find(model => model.name.toLowerCase() === modelName.toLowerCase());
    return model?.id || null;
  }, [allModelsData]);

  // Функция валидации модели для бренда
  const validateModelBrand = useCallback((modelId: string, brandId: string): boolean => {
    if (!allModelsData) return false;
    const model = allModelsData.find(m => m.id === modelId);
    return model?.brand_id === brandId;
  }, [allModelsData]);

  return {
    // Данные
    brands: filteredBrands,
    brandModels: filteredModels,
    allModels: allModelsData || [],
    
    // Состояние загрузки
    isLoadingBrands,
    isLoadingModels,
    isLoading: isLoadingBrands || isLoadingModels || isLoadingAllModels,
    
    // Ошибки
    brandsError,
    modelsError,
    
    // Выбранный бренд
    selectedBrandId,
    selectedBrand: selectedBrandId,
    setSelectedBrandId,
    selectBrand: setSelectedBrandId,
    
    // Поиск
    brandSearchTerm,
    setBrandSearchTerm,
    modelSearchTerm,
    setModelSearchTerm,
    
    // Функции обновления
    refetchBrands,
    refetchModels,
    
    // Вспомогательные функции
    findBrandNameById,
    findModelNameById,
    findBrandIdByName,
    findModelIdByName,
    validateModelBrand,
    brandModelCounts,
    
    // Статистика
    totalBrands: brandsData?.length || 0,
    totalModels: modelsData?.length || 0,
    filteredBrandsCount: filteredBrands.length,
    filteredModelsCount: filteredModels.length
  };
};
