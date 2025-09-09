import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CreatePriceOfferData, PriceOffer, UpdatePriceOfferData } from '@/types/price-offer';
import { toast } from 'sonner';
import { useBatchOffersInvalidation } from './use-price-offers-batch';
import { useEffect, useRef } from 'react';
import { devLog, prodError } from '@/utils/logger';
import { FLAGS } from '@/config/flags';

// Hook для проверки существующего предложения пользователя
export const useCheckPendingOffer = (productId: string, enabled: boolean = true) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-offer', productId, user?.id],
    queryFn: async () => {
      if (!user?.id) {
        devLog('useCheckPendingOffer: No user ID available', { productId, enabled });
        return null;
      }
      
      devLog('useCheckPendingOffer: Checking pending offer', { 
        productId, 
        userId: user.id,
        authUid: supabase.auth.getUser() 
      });
      
      const { data, error } = await supabase
        .from('price_offers')
        .select('*')
        .eq('product_id', productId)
        .eq('buyer_id', user.id)
        .eq('status', 'pending')
        .limit(1);
      
      if (error) {
        prodError(error, {
          context: 'check-pending-offer',
          productId,
          userId: user.id,
          errorCode: error.code
        });
        throw error;
      }
      
      devLog('useCheckPendingOffer: Query completed', { 
        productId, 
        userId: user.id,
        hasData: !!data?.[0] 
      });
      
      return data?.[0] || null;
    },
    enabled: enabled && !!user?.id,
  });
};

// Hook для получения конкурентных данных о предложениях
export const useCompetitiveOffers = (productId: string, enabled: boolean = true) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['competitive-offers', productId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase.rpc('get_competitive_offer_data', {
        p_product_id: productId,
        p_user_id: user.id,
      });
      
      if (error) {
        prodError(error, {
          context: 'fetch-competitive-offers',
          productId,
          userId: user?.id
        });
        throw error;
      }
      
      return data;
    },
    enabled: enabled && !!user?.id,
  });
};

// Hook для создания предложения цены
export const useCreatePriceOffer = () => {
  const queryClient = useQueryClient();
  const { invalidateBatchOffers } = useBatchOffersInvalidation();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: CreatePriceOfferData) => {
      if (!user?.id) {
        throw new Error('User must be authenticated to create offers');
      }

      // Check if user already has a PENDING offer for this product
      const { data: existingPendingOffer, error: checkError } = await supabase
        .from('price_offers')
        .select('id, status')
        .eq('product_id', data.product_id)
        .eq('buyer_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing offers:', checkError);
        throw checkError;
      }

      // If there's already a pending offer, prevent creating a new one
      if (existingPendingOffer) {
        throw new Error('You already have a pending offer for this product. Please wait for the seller to respond.');
      }

      // Always create a new offer (even if there are rejected/expired ones)
      const { data: result, error } = await supabase
        .from('price_offers')
        .insert({
          product_id: data.product_id,
          buyer_id: user.id,
          seller_id: data.seller_id,
          original_price: data.original_price,
          offered_price: data.offered_price,
          message: data.message,
          delivery_method: data.delivery_method,
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-offer', data.product_id] });
      queryClient.invalidateQueries({ queryKey: ['competitive-offers', data.product_id] });
      queryClient.invalidateQueries({ queryKey: ['pending-offer', data.product_id] });
      invalidateBatchOffers([data.product_id]);
      toast.success('Offer sent!');
    },
    onError: (error) => {
      prodError(error instanceof Error ? error : new Error(String(error)), {
        context: 'create-price-offer',
        userId: user?.id
      });
      
      // Специальная обработка constraint violation
      if (error.message?.includes('duplicate key value violates unique constraint')) {
        toast.error('You already have an active offer for this product. Refresh the page and try again.');
      } else {
        toast.error('Error sending offer');
      }
    },
  });
};

// Hook для удаления предложения цены (только для администраторов)
export const useDeletePriceOffer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (offerId: string) => {
      const { error } = await supabase
        .from('price_offers')
        .delete()
        .eq('id', offerId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate all price offer related queries
      queryClient.invalidateQueries({ queryKey: ['admin-price-offers'] });
      queryClient.invalidateQueries({ queryKey: ['buyer-price-offers'] });
      queryClient.invalidateQueries({ queryKey: ['seller-price-offers'] });
      queryClient.invalidateQueries({ queryKey: ['product-offers'] });
      
      toast.success('Предложение удалено');
    },
    onError: (error) => {
      prodError(error instanceof Error ? error : new Error(String(error)), {
        context: 'delete-price-offer'
      });
      toast.error('Ошибка при удалении предложения');
    },
  });
};

// Hook для обновления предложения цены
export const useUpdatePriceOffer = () => {
  const queryClient = useQueryClient();
  const { invalidateBatchOffers } = useBatchOffersInvalidation();
  const mountedRef = useRef(true);
  
  return useMutation({
    mutationFn: async ({ offerId, data }: { offerId: string; data: UpdatePriceOfferData }) => {
      devLog('Starting price offer update', {
        offerId,
        status: data.status,
        timestamp: new Date().toISOString()
      });

      // First, let's check if the offer exists and what its current state is
      const { data: currentOffer, error: fetchError } = await supabase
        .from('price_offers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (fetchError) {
        prodError(new Error(`Failed to fetch offer: ${fetchError.message}`), {
          context: 'update-price-offer-fetch',
          offerId,
          errorCode: fetchError.code,
          errorDetails: fetchError.details
        });
        throw new Error(`Failed to fetch offer: ${fetchError.message}`);
      }

      devLog('Current offer state fetched successfully');

      const { data: result, error } = await supabase
        .from('price_offers')
        .update({
          status: data.status,
          seller_response: data.seller_response,
          offered_price: data.offered_price,
          message: data.message,
          delivery_method: data.delivery_method,
          updated_at: new Date().toISOString()
        })
        .eq('id', offerId)
        .select()
        .single();
      
      if (error) {
        prodError(new Error(`Failed to update offer: ${error.message}`), {
          context: 'update-price-offer-mutation',
          offerId,
          errorCode: error.code,
          errorDetails: error.details,
          updateData: data
        });
        throw new Error(`Failed to update offer: ${error.message}`);
      }

      devLog('Price offer update successful', { offerId, newStatus: data.status });
      
      return result;
    },
    onSuccess: (data) => {
      if (!mountedRef.current) return;
      
      devLog('Price offer updated successfully, invalidating caches');
      
      // More targeted invalidation with exact keys
      queryClient.invalidateQueries({ queryKey: ['user-offer', data.product_id], exact: true });
      queryClient.invalidateQueries({ queryKey: ['competitive-offers', data.product_id], exact: true });
      queryClient.invalidateQueries({ queryKey: ['buyer-price-offers', data.buyer_id], exact: true });
      queryClient.invalidateQueries({ queryKey: ['seller-price-offers', data.seller_id], exact: true });
      queryClient.invalidateQueries({ queryKey: ['product-offers', data.product_id], exact: true });
      
      // Batch invalidation for performance
      invalidateBatchOffers([data.product_id]);
      
      toast.success('Offer updated!');
    },
    onError: (error) => {
      prodError(error instanceof Error ? error : new Error(String(error)), {
        context: 'update-price-offer-final'
      });
      toast.error(`Error updating offer: ${error.message}`);
    },
  });
};

// Hook для получения всех предложений продукта (для продавцов)
export const useProductOffers = (productId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['product-offers', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_offers')
        .select(`
          *,
          buyer_profile:profiles!buyer_id(
            id,
            full_name,
            opt_id,
            telegram
          )
        `)
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PriceOffer[];
    },
    enabled,
  });
};

// Hook для получения предложений покупателя с real-time обновлениями
export const useBuyerPriceOffers = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const mountedRef = useRef(true);
  
  const query = useQuery({
    queryKey: ['buyer-price-offers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('price_offers')
        .select(`
          *,
          product:products(
            id,
            title,
            brand,
            model,
            status,
            seller_name,
            product_images:product_images(url, is_primary)
          ),
          seller_profile:profiles!seller_id(
            id,
            full_name,
            opt_id,
            telegram
          )
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PriceOffer[];
    },
    enabled: !!user?.id,
  });

  // Automatic refetch after mutations handled by onSuccess callbacks above

  return query;
};

// Hook для получения предложений продавца с real-time обновлениями (оптимизированный)
export const useSellerPriceOffers = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['seller-price-offers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      devLog('Fetching seller price offers for user:', user.id);
      
      // Split query for better performance - get basic data first
      const { data, error } = await supabase
        .from('price_offers')
        .select(`
          id,
          status,
          offered_price,
          original_price,
          created_at,
          updated_at,
          product_id,
          buyer_id,
          seller_id,
          message,
          delivery_method,
          expires_at,
          seller_response
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        prodError(error, {
          context: 'fetch-seller-price-offers',
          userId: user.id
        });
        throw error;
      }
      
      devLog('Seller price offers fetched successfully:', data?.length || 0, 'offers');
      return data as PriceOffer[];
    },
    enabled: !!user?.id,
    staleTime: 60 * 1000, // Cache for 1 minute
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.status === 401 || error?.code === 401) return false;
      return failureCount < 1; // Max 1 retry
    },
    retryDelay: 1000 // Simple 1 second delay
  });

  // Manual refresh after mutations handled by onSuccess callbacks

  return query;
};

// Separate hook for detailed offer data (lazy loaded)
export const useSellerPriceOffersDetailed = (offerIds: string[]) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['seller-price-offers-detailed', user?.id, offerIds],
    queryFn: async () => {
      if (!user?.id || !offerIds.length) return [];
      
      const { data, error } = await supabase
        .from('price_offers')
        .select(`
          *,
          product:products(
            id,
            title,
            brand,
            model,
            price,
            status,
            seller_name,
            product_images:product_images(url, is_primary)
          ),
          buyer_profile:profiles!buyer_id(
            id,
            full_name,
            opt_id,
            telegram
          )
        `)
        .in('id', offerIds)
        .eq('seller_id', user.id);
      
      if (error) throw error;
      return data as PriceOffer[];
    },
    enabled: !!user?.id && offerIds.length > 0,
    staleTime: 1 * 60 * 1000, // 1 minute cache
  });
};

// Hook для админа для получения всех предложений
export const useAdminPriceOffers = () => {
  return useQuery({
    queryKey: ['admin-price-offers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_offers')
        .select(`
          *,
          product:products(
            id,
            title,
            brand,
            model,
            status,
            seller_name,
            product_images:product_images(url, is_primary)
          ),
          buyer_profile:profiles!buyer_id(
            id,
            full_name,
            opt_id,
            telegram
          ),
          seller_profile:profiles!seller_id(
            id,
            full_name,
            opt_id,
            telegram
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PriceOffer[];
    },
  });
};
