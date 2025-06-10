
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDebounceValue } from './useDebounceValue';
import { useState, useEffect, useCallback } from 'react';

export interface CarBrand {
  id: string;
  name: string;
}

export interface CarModel {
  id: string;
  name: string;
  brand_id: string;
}

const BRANDS_PER_PAGE = 30;
const MODELS_PER_PAGE = 30;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах

// Функция для сохранения в localStorage с контролем версии и временем истечения
const saveToCache = (key: string, value: any) => {
  try {
    const item = {
      value,
      timestamp: Date.now(),
      version: 1 // Увеличивайте при изменении структуры данных
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.warn('Ошибка сохранения в localStorage:', error);
  }
};

// Функция для загрузки из localStorage с проверкой срока годности
const loadFromCache = (key: string) => {
  try {
    const itemString = localStorage.getItem(key);
    if (!itemString) return null;
    
    const item = JSON.parse(itemString);
    
    // Проверяем версию и срок годности
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

export const useCarBrandsAndModels = (initialBrandId?: string) => {
  const [brandSearchTerm, setBrandSearchTerm] = useState('');
  const debouncedBrandSearchTerm = useDebounceValue(brandSearchTerm, 300);
  
  const [modelSearchTerm, setModelSearchTerm] = useState('');
  const debouncedModelSearchTerm = useDebounceValue(modelSearchTerm, 300);
  
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(initialBrandId || null);
  const [brandsPage, setBrandsPage] = useState(0);
  const [modelsPage, setModelsPage] = useState(0);

  // Загрузка брендов с кэшированием, пагинацией и поиском
  const {
    data: brandsData,
    isLoading: isLoadingBrands,
    error: brandsError,
    refetch: refetchBrands
  } = useQuery({
    queryKey: ['car-brands', debouncedBrandSearchTerm, brandsPage],
    queryFn: async () => {
      // Пытаемся загрузить из кэша только для первой страницы без поиска
      if (brandsPage === 0 && !debouncedBrandSearchTerm) {
        const cached = loadFromCache('car-brands');
        if (cached) {
          console.log('🗄️ Загружены марки автомобилей из кэша');
          return cached;
        }
      }
      
      console.log('🔍 Загрузка марок автомобилей из базы данных', { 
        search: debouncedBrandSearchTerm, 
        page: brandsPage 
      });
      
      // Строим запрос с поиском и пагинацией
      let query = supabase
        .from('car_brands')
        .select('id, name')
        .order('name', { ascending: true })
        .range(brandsPage * BRANDS_PER_PAGE, (brandsPage + 1) * BRANDS_PER_PAGE - 1);
      
      // Добавляем поиск при необходимости
      if (debouncedBrandSearchTerm) {
        query = query.ilike('name', `%${debouncedBrandSearchTerm}%`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Ошибка загрузки марок автомобилей:', error);
        throw error;
      }
      
      // Кэшируем только результаты первой страницы без поиска
      if (brandsPage === 0 && !debouncedBrandSearchTerm) {
        saveToCache('car-brands', data);
      }
      
      return data || [];
    },
    staleTime: 15 * 60 * 1000, // 15 минут
    gcTime: 60 * 60 * 1000, // 1 час
  });

  // Загрузка моделей для выбранного бренда с кэшированием, пагинацией и поиском
  const {
    data: modelsData,
    isLoading: isLoadingModels,
    error: modelsError,
    refetch: refetchModels
  } = useQuery({
    queryKey: ['car-models', selectedBrandId, debouncedModelSearchTerm, modelsPage],
    queryFn: async () => {
      // Если бренд не выбран, возвращаем пустой массив
      if (!selectedBrandId) return [];
      
      // Пытаемся загрузить из кэша только для первой страницы без поиска
      const cacheKey = `car-models-${selectedBrandId}`;
      if (modelsPage === 0 && !debouncedModelSearchTerm) {
        const cached = loadFromCache(cacheKey);
        if (cached) {
          console.log('🗄️ Загружены модели автомобилей из кэша', { brandId: selectedBrandId });
          return cached;
        }
      }
      
      console.log('🔍 Загрузка моделей автомобилей из базы данных', { 
        brandId: selectedBrandId,
        search: debouncedModelSearchTerm,
        page: modelsPage
      });
      
      // Строим запрос с поиском и пагинацией
      let query = supabase
        .from('car_models')
        .select('id, name, brand_id')
        .eq('brand_id', selectedBrandId)
        .order('name', { ascending: true })
        .range(modelsPage * MODELS_PER_PAGE, (modelsPage + 1) * MODELS_PER_PAGE - 1);
      
      // Добавляем поиск при необходимости
      if (debouncedModelSearchTerm) {
        query = query.ilike('name', `%${debouncedModelSearchTerm}%`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Ошибка загрузки моделей автомобилей:', error);
        throw error;
      }
      
      // Кэшируем только результаты первой страницы без поиска
      if (modelsPage === 0 && !debouncedModelSearchTerm) {
        saveToCache(cacheKey, data);
      }
      
      return data || [];
    },
    staleTime: 15 * 60 * 1000, // 15 минут
    gcTime: 60 * 60 * 1000, // 1 час
    enabled: !!selectedBrandId,
  });

  // Load all models for backward compatibility
  const {
    data: allModelsData,
    isLoading: isLoadingAllModels
  } = useQuery({
    queryKey: ['all-car-models'],
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

  // Сбрасываем страницу и выбранную модель при изменении поисковых запросов или выбранного бренда
  useEffect(() => {
    setBrandsPage(0);
  }, [debouncedBrandSearchTerm]);
  
  useEffect(() => {
    setModelsPage(0);
  }, [debouncedModelSearchTerm, selectedBrandId]);

  // Новая функция для поиска бренда по ID
  const findBrandNameById = useCallback((brandId: string | null): string | null => {
    if (!brandId || !brandsData) return null;
    const brand = brandsData.find(brand => brand.id === brandId);
    return brand?.name || null;
  }, [brandsData]);

  // Новая функция для поиска модели по ID
  const findModelNameById = useCallback((modelId: string | null): string | null => {
    if (!modelId || !modelsData) return null;
    const model = modelsData.find(model => model.id === modelId);
    return model?.name || null;
  }, [modelsData]);

  // Additional functions for backward compatibility
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

  const validateModelBrand = useCallback((modelId: string, brandId: string): boolean => {
    if (!allModelsData) return false;
    const model = allModelsData.find(m => m.id === modelId);
    return model?.brand_id === brandId;
  }, [allModelsData]);

  return {
    brands: brandsData || [],
    brandModels: modelsData || [],
    allModels: allModelsData || [], // For backward compatibility
    isLoadingBrands,
    isLoadingModels,
    isLoading: isLoadingBrands || isLoadingModels || isLoadingAllModels, // Combined loading state
    brandsError,
    modelsError,
    selectedBrandId,
    selectedBrand: selectedBrandId, // Alias for backward compatibility
    setSelectedBrandId,
    selectBrand: setSelectedBrandId, // Alias for backward compatibility
    refetchBrands,
    refetchModels,
    brandSearchTerm,
    setBrandSearchTerm,
    modelSearchTerm,
    setModelSearchTerm,
    brandsPage,
    setBrandsPage,
    modelsPage,
    setModelsPage,
    hasMoreBrands: (brandsData?.length || 0) === BRANDS_PER_PAGE,
    hasMoreModels: (modelsData?.length || 0) === MODELS_PER_PAGE,
    findBrandNameById,
    findModelNameById,
    findBrandIdByName,
    findModelIdByName,
    validateModelBrand
  };
};
