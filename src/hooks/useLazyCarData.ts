
import { useState, useCallback, useMemo } from 'react';
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

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 часа
const PAGE_SIZE = 50;

// Функции кэширования
const saveToCache = (key: string, value: any) => {
  try {
    const item = { value, timestamp: Date.now(), version: 1 };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.warn('Ошибка сохранения в localStorage:', error);
  }
};

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

export const useLazyCarData = () => {
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [brandSearchTerm, setBrandSearchTerm] = useState('');
  const [modelSearchTerm, setModelSearchTerm] = useState('');
  const [brandsLoaded, setBrandsLoaded] = useState(false);

  // Lazy loading брендов - загружаем только при первом обращении
  const {
    data: brandsData,
    isLoading: isLoadingBrands,
    error: brandsError
  } = useQuery({
    queryKey: ['lazy-car-brands'],
    queryFn: async () => {
      const cached = loadFromCache('lazy-car-brands');
      if (cached) {
        console.log('🗄️ Загружены бренды из кэша');
        return cached;
      }
      
      console.log('🔍 Загрузка брендов из базы данных');
      const { data, error } = await supabase
        .from('car_brands')
        .select('id, name')
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      saveToCache('lazy-car-brands', data);
      console.log('✅ Загружено брендов:', data?.length);
      return data || [];
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    enabled: brandsLoaded, // Загружаем только когда нужно
  });

  // Lazy loading моделей для выбранного бренда
  const {
    data: modelsData,
    isLoading: isLoadingModels,
    error: modelsError
  } = useQuery({
    queryKey: ['lazy-car-models', selectedBrandId],
    queryFn: async () => {
      if (!selectedBrandId) return [];
      
      const cacheKey = `lazy-car-models-${selectedBrandId}`;
      const cached = loadFromCache(cacheKey);
      if (cached) {
        console.log('🗄️ Загружены модели из кэша для бренда:', selectedBrandId);
        return cached;
      }
      
      console.log('🔍 Загрузка моделей для бренда:', selectedBrandId);
      const { data, error } = await supabase
        .from('car_models')
        .select('id, name, brand_id')
        .eq('brand_id', selectedBrandId)
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      saveToCache(cacheKey, data);
      console.log('✅ Загружено моделей:', data?.length);
      return data || [];
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    enabled: !!selectedBrandId,
  });

  // Функция для инициализации загрузки брендов
  const initializeBrands = useCallback(() => {
    if (!brandsLoaded) {
      console.log('🚀 Инициализация загрузки брендов');
      setBrandsLoaded(true);
    }
  }, [brandsLoaded]);

  // Фильтрация брендов по поисковому запросу
  const filteredBrands = useMemo(() => {
    if (!brandsData) return [];
    if (!brandSearchTerm.trim()) return brandsData.slice(0, PAGE_SIZE);
    
    return brandsData
      .filter(brand => brand.name.toLowerCase().includes(brandSearchTerm.toLowerCase()))
      .slice(0, PAGE_SIZE);
  }, [brandsData, brandSearchTerm]);

  // Фильтрация моделей по поисковому запросу
  const filteredModels = useMemo(() => {
    if (!modelsData) return [];
    if (!modelSearchTerm.trim()) return modelsData.slice(0, PAGE_SIZE);
    
    return modelsData
      .filter(model => model.name.toLowerCase().includes(modelSearchTerm.toLowerCase()))
      .slice(0, PAGE_SIZE);
  }, [modelsData, modelSearchTerm]);

  // Функции поиска
  const findBrandIdByName = useCallback((brandName: string | null): string | null => {
    if (!brandName || !brandsData) return null;
    const brand = brandsData.find(brand => brand.name.toLowerCase() === brandName.toLowerCase());
    return brand?.id || null;
  }, [brandsData]);

  const findModelIdByName = useCallback((modelName: string | null): string | null => {
    if (!modelName || !modelsData) return null;
    const model = modelsData.find(model => model.name.toLowerCase() === modelName.toLowerCase());
    return model?.id || null;
  }, [modelsData]);

  const validateModelBrand = useCallback((modelId: string, brandId: string): boolean => {
    if (!modelsData) return false;
    const model = modelsData.find(m => m.id === modelId);
    return model?.brand_id === brandId;
  }, [modelsData]);

  return {
    // Данные
    brands: filteredBrands,
    brandModels: filteredModels,
    
    // Состояние загрузки
    isLoadingBrands: brandsLoaded && isLoadingBrands,
    isLoadingModels,
    isLoading: (brandsLoaded && isLoadingBrands) || isLoadingModels,
    
    // Ошибки
    brandsError,
    modelsError,
    
    // Управление состоянием
    selectedBrandId,
    setSelectedBrandId,
    selectBrand: setSelectedBrandId,
    
    // Поиск
    brandSearchTerm,
    setBrandSearchTerm,
    modelSearchTerm,
    setModelSearchTerm,
    
    // Lazy loading
    initializeBrands,
    brandsLoaded,
    
    // Вспомогательные функции
    findBrandIdByName,
    findModelIdByName,
    validateModelBrand,
    
    // Статистика
    totalBrands: brandsData?.length || 0,
    totalModels: modelsData?.length || 0,
    filteredBrandsCount: filteredBrands.length,
    filteredModelsCount: filteredModels.length
  };
};
