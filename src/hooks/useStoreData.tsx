import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StoreWithImages, StoreReview } from '@/types/store';

export const useStoreData = (storeId: string) => {
  // Store data query
  const { data: store, isLoading: isStoreLoading, refetch } = useQuery({
    queryKey: ['store', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select(`
          *,
          store_images(*)
        `)
        .eq('id', storeId)
        .single();
      
      if (error) throw error;
      return data as StoreWithImages;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  // Car brands and models query
  const { data: carBrandsData, isLoading: isBrandsLoading } = useQuery({
    queryKey: ['store-car-brands', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      
      const { data: brandData, error: brandError } = await supabase
        .from('store_car_brands')
        .select(`
          car_brands(id, name)
        `)
        .eq('store_id', storeId);
      
      if (brandError) throw brandError;
      
      const { data: modelData, error: modelError } = await supabase
        .from('store_car_models')
        .select(`
          car_models(id, name, brand_id)
        `)
        .eq('store_id', storeId);
        
      if (modelError) throw modelError;
      
      const carBrands = brandData.map((brand) => {
        const brandId = brand.car_brands.id;
        const models = modelData
          .filter(model => model.car_models.brand_id === brandId)
          .map(model => ({
            id: model.car_models.id,
            name: model.car_models.name
          }));
        
        return {
          id: brandId,
          name: brand.car_brands.name,
          models: models
        };
      });
      
      return carBrands;
    },
    enabled: !!storeId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  // Seller products query
  const { data: sellerProducts, isLoading: isProductsLoading } = useQuery({
    queryKey: ['seller-products', store?.seller_id],
    queryFn: async () => {
      if (!store?.seller_id) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, title, price, created_at, status, brand, model,
          cloudinary_public_id, cloudinary_url, preview_image_url,
          product_images(url, is_primary)
        `)
        .eq('seller_id', store.seller_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    enabled: !!store?.seller_id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  // Reviews query
  const { data: reviews, isLoading: isReviewsLoading } = useQuery({
    queryKey: ['store-reviews', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_reviews')
        .select(`
          *,
          profiles:user_id (full_name, avatar_url)
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(review => ({
        ...review,
        user_name: review.profiles?.full_name,
        user_avatar: review.profiles?.avatar_url
      })) as StoreReview[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  // Seller product count query
  const { data: productCount = 0, isLoading: isCountLoading } = useQuery({
    queryKey: ['seller-products-count', store?.seller_id],
    queryFn: async () => {
      if (!store?.seller_id) return 0;
      
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', store.seller_id)
        .eq('status', 'active');
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!store?.seller_id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  // Sold product count query
  const { data: soldProductCount = 0, isLoading: isSoldCountLoading } = useQuery({
    queryKey: ['seller-sold-products-count', store?.seller_id],
    queryFn: async () => {
      if (!store?.seller_id) return 0;
      
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', store.seller_id)
        .eq('status', 'sold');
      
      if (error) throw error;
      return count || 0;
    },
    enabled: !!store?.seller_id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000
  });

  return {
    store,
    isStoreLoading,
    refetch,
    carBrandsData,
    isBrandsLoading,
    sellerProducts,
    isProductsLoading,
    reviews,
    isReviewsLoading,
    productCount,
    isCountLoading,
    soldProductCount,
    isSoldCountLoading
  };
};
