
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  const [brands, setBrands] = useState<CarBrand[]>([]);
  const [brandModels, setBrandModels] = useState<CarModel[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBrands = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('car_brands')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching car brands:', error);
        setError('Failed to load car brands');
        return;
      }

      setBrands(data || []);
    } catch (err) {
      console.error('Error in fetchBrands:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchModelsByBrand = useCallback(async (brandId: string) => {
    if (!brandId) {
      setBrandModels([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('car_models')
        .select('*')
        .eq('brand_id', brandId)
        .order('name');

      if (error) {
        console.error('Error fetching car models:', error);
        setError('Failed to load car models');
        return;
      }

      setBrandModels(data || []);
    } catch (err) {
      console.error('Error in fetchModelsByBrand:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load brands on component mount
  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // Fetch models when selected brand changes
  useEffect(() => {
    if (selectedBrand) {
      fetchModelsByBrand(selectedBrand);
    } else {
      setBrandModels([]);
    }
  }, [selectedBrand, fetchModelsByBrand]);

  const selectBrand = useCallback((brandId: string) => {
    setSelectedBrand(brandId);
    // We don't clear brandModels here anymore, we'll wait for the fetch to complete
  }, []);

  // Helper function to find brand ID by name
  const findBrandIdByName = useCallback((brandName: string) => {
    const brand = brands.find(b => b.name.toLowerCase() === brandName.toLowerCase());
    return brand?.id || null;
  }, [brands]);
  
  // Helper function to find model ID by name and brand ID
  const findModelIdByName = useCallback((modelName: string, brandId: string) => {
    if (!brandId) return null;
    
    const model = brandModels.find(
      m => m.brand_id === brandId && m.name.toLowerCase() === modelName.toLowerCase()
    );
    return model?.id || null;
  }, [brandModels]);

  // New helper to validate if a model belongs to a brand
  const validateModelBrand = useCallback((modelId: string, brandId: string) => {
    return brandModels.some(model => model.id === modelId && model.brand_id === brandId);
  }, [brandModels]);

  return {
    brands,
    brandModels,
    selectedBrand,
    selectBrand,
    isLoading,
    error,
    findBrandIdByName,
    findModelIdByName,
    validateModelBrand
  };
}
