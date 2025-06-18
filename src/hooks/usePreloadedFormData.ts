
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Brand {
  id: string;
  name: string;
}

interface Model {
  id: string;
  name: string;
  brand_id: string;
}

interface BuyerProfile {
  id: string;
  full_name: string;
  opt_id: string;
  telegram: string;
  user_type: 'buyer';
}

interface SellerProfile {
  id: string;
  full_name: string;
  opt_id: string;
  telegram: string;
  user_type: 'seller';
}

export const usePreloadedFormData = () => {
  // Загружаем бренды
  const { data: brands = [], isLoading: isLoadingBrands } = useQuery({
    queryKey: ['car-brands-preload'],
    queryFn: async (): Promise<Brand[]> => {
      const { data, error } = await supabase
        .from('car_brands')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Загружаем все модели
  const { data: allModels = [], isLoading: isLoadingModels } = useQuery({
    queryKey: ['car-models-all-preload'],
    queryFn: async (): Promise<Model[]> => {
      const { data, error } = await supabase
        .from('car_models')
        .select('id, name, brand_id')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Загружаем покупателей
  const { data: buyerProfiles = [], isLoading: isLoadingBuyers } = useQuery({
    queryKey: ['buyer-profiles-preload'],
    queryFn: async (): Promise<BuyerProfile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, opt_id, telegram')
        .eq('user_type', 'buyer')
        .not('opt_id', 'is', null)
        .neq('opt_id', '')
        .order('opt_id', { ascending: true })
        .limit(200);

      if (error) throw error;
      return (data || []).map(profile => ({
        ...profile,
        user_type: 'buyer' as const
      }));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  // Загружаем продавцов
  const { data: sellerProfiles = [], isLoading: isLoadingSellers } = useQuery({
    queryKey: ['seller-profiles-preload'],
    queryFn: async (): Promise<SellerProfile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, opt_id, telegram')
        .eq('user_type', 'seller')
        .order('full_name', { ascending: true })
        .limit(200);

      if (error) throw error;
      return (data || []).map(profile => ({
        ...profile,
        user_type: 'seller' as const
      }));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  // Функция для получения моделей по бренду
  const getModelsByBrand = (brandId: string): Model[] => {
    return allModels.filter(model => model.brand_id === brandId);
  };

  // Функция поиска бренда по ID
  const findBrandById = (brandId: string): Brand | null => {
    return brands.find(brand => brand.id === brandId) || null;
  };

  // Функция поиска модели по ID
  const findModelById = (modelId: string): Model | null => {
    return allModels.find(model => model.id === modelId) || null;
  };

  const isLoading = isLoadingBrands || isLoadingModels || isLoadingBuyers || isLoadingSellers;

  return {
    // Данные
    brands,
    allModels,
    buyerProfiles,
    sellerProfiles,
    
    // Состояния загрузки
    isLoading,
    isLoadingBrands,
    isLoadingModels,
    isLoadingBuyers,
    isLoadingSellers,
    
    // Утилиты
    getModelsByBrand,
    findBrandById,
    findModelById,
    
    // Готовность данных
    isDataReady: !isLoading && brands.length > 0 && buyerProfiles.length > 0 && sellerProfiles.length > 0
  };
};
