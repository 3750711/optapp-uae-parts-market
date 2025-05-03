
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

  const fetchBrands = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('car_brands')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching car brands:', error);
        return;
      }

      setBrands(data || []);
    } catch (err) {
      console.error('Error in fetchBrands:', err);
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
    try {
      const { data, error } = await supabase
        .from('car_models')
        .select('*')
        .eq('brand_id', brandId)
        .order('name');

      if (error) {
        console.error('Error fetching car models:', error);
        return;
      }

      setBrandModels(data || []);
    } catch (err) {
      console.error('Error in fetchModelsByBrand:', err);
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

  const selectBrand = (brandId: string) => {
    setSelectedBrand(brandId);
  };

  return {
    brands,
    brandModels,
    selectedBrand,
    selectBrand,
    isLoading
  };
}
