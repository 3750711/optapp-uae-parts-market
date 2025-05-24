
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface StoreBrand {
  id: string;
  name: string;
  store_id: string;
}

interface StoreModel {
  id: string;
  name: string;
  brand_id: string;
  store_id: string;
}

export function useStoreCarBrandsAndModels() {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  
  // Fetch store car brands
  const { 
    data: brands = [], 
    isLoading: isBrandsLoading,
    error: brandsError
  } = useQuery({
    queryKey: ['store', 'car-brands'],
    queryFn: async () => {
      console.log('Fetching store car brands');
      const { data, error } = await supabase
        .from('store_car_brands')
        .select(`
          id,
          store_id,
          car_brands!inner (
            id,
            name
          )
        `)
        .order('car_brands(name)');

      if (error) {
        console.error('Error fetching store car brands:', error);
        throw error;
      }
      
      console.log('Fetched store car brands:', data);
      
      // Transform data to match expected interface
      const transformedData = data?.map(item => ({
        id: item.car_brands.id,
        name: item.car_brands.name,
        store_id: item.store_id
      })) || [];
      
      return transformedData as StoreBrand[];
    }
  });

  // Fetch store car models for selected brand
  const { 
    data: brandModels = [],
    isLoading: isModelsLoading,
    error: modelsError
  } = useQuery({
    queryKey: ['store', 'car-models', selectedBrand],
    queryFn: async () => {
      if (!selectedBrand) return [];
      
      console.log('Fetching store car models for brand ID:', selectedBrand);
      const { data, error } = await supabase
        .from('store_car_models')
        .select(`
          id,
          store_id,
          car_models!inner (
            id,
            name,
            brand_id
          )
        `)
        .eq('car_models.brand_id', selectedBrand)
        .order('car_models(name)');

      if (error) {
        console.error('Error fetching store car models:', error);
        throw error;
      }
      
      console.log('Fetched store car models:', data);
      
      // Transform data to match expected interface
      const transformedData = data?.map(item => ({
        id: item.car_models.id,
        name: item.car_models.name,
        brand_id: item.car_models.brand_id,
        store_id: item.store_id
      })) || [];
      
      return transformedData as StoreModel[];
    },
    enabled: !!selectedBrand,
  });

  const selectBrand = useCallback((brandId: string | null) => {
    console.log('Selecting brand:', brandId);
    setSelectedBrand(brandId);
  }, []);

  // Helper function to find brand ID by name
  const findBrandIdByName = useCallback((brandName: string) => {
    if (!brandName || !brands || brands.length === 0) return null;
    const brand = brands.find(b => b.name.toLowerCase() === brandName.toLowerCase());
    return brand?.id || null;
  }, [brands]);
  
  // Helper function to find model ID by name and brand ID
  const findModelIdByName = useCallback((modelName: string | null, brandId: string) => {
    if (!brandId || !modelName || !brandModels || brandModels.length === 0) return null;
    
    const model = brandModels.find(
      m => m.brand_id === brandId && m.name.toLowerCase() === modelName.toLowerCase()
    );
    return model?.id || null;
  }, [brandModels]);

  // Helper to find brand name by ID
  const findBrandNameById = useCallback((brandId: string | null) => {
    if (!brandId || !brands || brands.length === 0) return null;
    const brand = brands.find(b => b.id === brandId);
    return brand?.name || null;
  }, [brands]);

  // Helper to find model name by ID
  const findModelNameById = useCallback((modelId: string | null) => {
    if (!modelId || !brandModels || brandModels.length === 0) return null;
    const model = brandModels.find(m => m.id === modelId);
    return model?.name || null;
  }, [brandModels]);

  // Helper to validate if a model belongs to a brand
  const validateModelBrand = useCallback((modelId: string, brandId: string) => {
    if (!brandModels || brandModels.length === 0 || !modelId || !brandId) return false;
    return brandModels.some(model => model.id === modelId && model.brand_id === brandId);
  }, [brandModels]);

  return {
    brands: brands || [],
    brandModels: brandModels || [],
    selectedBrand,
    selectBrand,
    isLoading: isBrandsLoading || isModelsLoading,
    error: brandsError || modelsError,
    findBrandIdByName,
    findModelIdByName,
    findBrandNameById,
    findModelNameById,
    validateModelBrand
  };
}
