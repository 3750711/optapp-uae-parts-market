
import { useCallback, useEffect, useState } from "react";
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
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  
  // Use React Query for brands
  const { 
    data: brands = [], 
    isLoading: isBrandsLoading,
    error: brandsError
  } = useQuery({
    queryKey: ['admin', 'car-brands'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('car_brands')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as CarBrand[] || []; // Ensure we return an empty array if data is null
    }
  });

  // Use React Query for models by brand
  const { 
    data: brandModels = [],
    isLoading: isModelsLoading,
    error: modelsError
  } = useQuery({
    queryKey: ['admin', 'car-models', selectedBrand],
    queryFn: async () => {
      if (!selectedBrand) return [];
      
      const { data, error } = await supabase
        .from('car_models')
        .select('*')
        .eq('brand_id', selectedBrand)
        .order('name');

      if (error) throw error;
      return data as CarModel[] || []; // Ensure we return an empty array if data is null
    },
    enabled: !!selectedBrand,
  });

  const selectBrand = useCallback((brandId: string) => {
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

  // New helper to validate if a model belongs to a brand
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
    validateModelBrand
  };
}
