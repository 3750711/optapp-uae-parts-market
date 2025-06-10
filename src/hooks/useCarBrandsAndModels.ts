
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface CarBrand {
  id: string;
  name: string;
}

interface CarModel {
  id: string;
  name: string;
  brand_id: string;
}

export function useCarBrandsAndModels() {
  // Загружаем бренды
  const { 
    data: brands = [], 
    isLoading: isBrandsLoading,
    error: brandsError
  } = useQuery({
    queryKey: ['catalog', 'car-brands'],
    queryFn: async () => {
      console.log('Fetching car brands');
      const { data, error } = await supabase
        .from('car_brands')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching car brands:', error);
        throw error;
      }
      console.log('Fetched car brands:', data);
      return data as CarBrand[] || [];
    }
  });

  // Загружаем ВСЕ модели сразу
  const { 
    data: allModels = [],
    isLoading: isModelsLoading,
    error: modelsError
  } = useQuery({
    queryKey: ['catalog', 'car-models'],
    queryFn: async () => {
      console.log('Fetching all car models');
      const { data, error } = await supabase
        .from('car_models')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching car models:', error);
        throw error;
      }
      console.log('Fetched car models:', data);
      return data as CarModel[] || [];
    }
  });

  // Helper function to find brand name by ID
  const findBrandNameById = useCallback((brandId: string | null) => {
    if (!brandId || !brands || brands.length === 0) return null;
    const brand = brands.find(b => b.id === brandId);
    return brand?.name || null;
  }, [brands]);

  // Helper function to find model name by ID
  const findModelNameById = useCallback((modelId: string | null) => {
    if (!modelId || !allModels || allModels.length === 0) return null;
    const model = allModels.find(m => m.id === modelId);
    return model?.name || null;
  }, [allModels]);

  // Helper function to find brand ID by name
  const findBrandIdByName = useCallback((brandName: string) => {
    if (!brandName || !brands || brands.length === 0) return null;
    const brand = brands.find(b => b.name.toLowerCase() === brandName.toLowerCase());
    return brand?.id || null;
  }, [brands]);
  
  // Helper function to find model ID by name and brand ID
  const findModelIdByName = useCallback((modelName: string | null, brandId: string) => {
    if (!brandId || !modelName || !allModels || allModels.length === 0) return null;
    
    const model = allModels.find(
      m => m.brand_id === brandId && m.name.toLowerCase() === modelName.toLowerCase()
    );
    return model?.id || null;
  }, [allModels]);

  // Helper to validate if a model belongs to a brand
  const validateModelBrand = useCallback((modelId: string, brandId: string) => {
    if (!allModels || allModels.length === 0 || !modelId || !brandId) return false;
    return allModels.some(model => model.id === modelId && model.brand_id === brandId);
  }, [allModels]);

  return {
    brands: brands || [],
    allModels: allModels || [],
    isLoading: isBrandsLoading || isModelsLoading,
    error: brandsError || modelsError,
    findBrandIdByName,
    findModelIdByName,
    findBrandNameById,
    findModelNameById,
    validateModelBrand
  };
}
