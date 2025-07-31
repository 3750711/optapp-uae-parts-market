import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CreatePriceOfferData, PriceOffer, UpdatePriceOfferData } from '@/types/price-offer';
import { toast } from 'sonner';
import { useBatchOffersInvalidation } from './use-price-offers-batch';
import { useEffect } from 'react';

// Hook для проверки существующего предложения пользователя
export const useCheckPendingOffer = (productId: string, enabled: boolean = true) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-offer', productId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('price_offers')
        .select('*')
        .eq('product_id', productId)
        .eq('buyer_id', user.id)
        .eq('status', 'pending')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
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
        console.error('Error fetching competitive offers:', error);
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

      // Ищем любое последнее предложение от покупателя (pending или rejected)
      const { data: existingOffer, error: checkError } = await supabase
        .from('price_offers')
        .select('id, status')
        .eq('product_id', data.product_id)
        .eq('buyer_id', user.id)
        .in('status', ['pending', 'rejected'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing offer:', checkError);
        throw checkError;
      }

      // Если есть существующее предложение (pending или rejected), обновляем его
      if (existingOffer) {
        const { data: result, error: updateError } = await supabase
          .from('price_offers')
          .update({
            offered_price: data.offered_price,
            message: data.message,
            original_price: data.original_price,
            delivery_method: data.delivery_method,
            status: 'pending', // Сбрасываем статус в pending
            seller_response: null, // Очищаем предыдущий ответ продавца
            expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // +6 часов
            updated_at: new Date().toISOString()
          })
          .eq('id', existingOffer.id)
          .select()
          .single();
        
        if (updateError) throw updateError;
        return result;
      }

      // Если нет существующего предложения, создаем новое
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
      console.error('Error creating offer:', error);
      
      // Специальная обработка constraint violation
      if (error.message?.includes('duplicate key value violates unique constraint')) {
        toast.error('You already have an active offer for this product. Refresh the page and try again.');
      } else {
        toast.error('Error sending offer');
      }
    },
  });
};

// Hook для обновления предложения цены
export const useUpdatePriceOffer = () => {
  const queryClient = useQueryClient();
  const { invalidateBatchOffers } = useBatchOffersInvalidation();
  
  return useMutation({
    mutationFn: async ({ offerId, data }: { offerId: string; data: UpdatePriceOfferData }) => {
      console.log('🔄 useUpdatePriceOffer: Starting update', {
        offerId,
        data,
        timestamp: new Date().toISOString()
      });

      // First, let's check if the offer exists and what its current state is
      const { data: currentOffer, error: fetchError } = await supabase
        .from('price_offers')
        .select('*')
        .eq('id', offerId)
        .single();

      if (fetchError) {
        console.error('❌ useUpdatePriceOffer: Error fetching current offer', {
          offerId,
          error: fetchError,
          code: fetchError.code,
          message: fetchError.message,
          details: fetchError.details
        });
        throw new Error(`Failed to fetch offer: ${fetchError.message}`);
      }

      console.log('📋 useUpdatePriceOffer: Current offer state', currentOffer);

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
        console.error('❌ useUpdatePriceOffer: Update failed', {
          offerId,
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          updateData: data
        });
        throw new Error(`Failed to update offer: ${error.message}`);
      }

      console.log('✅ useUpdatePriceOffer: Update successful', {
        offerId,
        before: currentOffer,
        after: result
      });
      
      return result;
    },
    onSuccess: (data) => {
      console.log('🔄 Price offer updated successfully, invalidating caches:', data);
      
      // Invalidate buyer-related caches
      queryClient.invalidateQueries({ queryKey: ['user-offer', data.product_id] });
      queryClient.invalidateQueries({ queryKey: ['competitive-offers', data.product_id] });
      queryClient.invalidateQueries({ queryKey: ['buyer-price-offers'] });
      queryClient.invalidateQueries({ queryKey: ['buyer-offers'] });
      queryClient.invalidateQueries({ queryKey: ['buyer-offer-counts'] });
      
      // Invalidate seller-related caches
      queryClient.invalidateQueries({ queryKey: ['seller-price-offers'] });
      queryClient.invalidateQueries({ queryKey: ['product-offers', data.product_id] });
      
      // Invalidate admin-related caches
      queryClient.invalidateQueries({ queryKey: ['admin-price-offers'] });
      
      // Invalidate batch offers
      invalidateBatchOffers([data.product_id]);
      
      // Force refetch of critical queries for immediate UI updates
      queryClient.refetchQueries({ queryKey: ['seller-price-offers'] });
      queryClient.refetchQueries({ queryKey: ['admin-price-offers'] });
      
      toast.success('Offer updated!');
    },
    onError: (error) => {
      console.error('❌ useUpdatePriceOffer: Final error handler', error);
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

  // Set up real-time subscription for buyer price offers
  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up real-time subscription for buyer price offers');

    const channel = supabase
      .channel('buyer-price-offers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'price_offers',
          filter: `buyer_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Buyer price offer change detected:', payload);
          
          // Show notification if offer was cancelled
          if (payload.eventType === 'UPDATE' && payload.new?.status === 'cancelled') {
            toast.info('One of your offers was cancelled because the product has been sold to another buyer.');
          }
          
          // Invalidate and refetch the query
          queryClient.invalidateQueries({ queryKey: ['buyer-price-offers', user.id] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription for buyer price offers');
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return query;
};

// Hook для получения предложений продавца с real-time обновлениями
export const useSellerPriceOffers = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['seller-price-offers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('🔍 Fetching seller price offers for user:', user.id);
      
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
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching seller price offers:', error);
        throw error;
      }
      
      console.log('✅ Seller price offers fetched:', data?.length || 0, 'offers');
      return data as PriceOffer[];
    },
    enabled: !!user?.id,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // Set up real-time subscription for price offers
  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up real-time subscription for seller price offers');

    const channel = supabase
      .channel('seller-price-offers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'price_offers',
          filter: `seller_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Price offer change detected:', payload);
          // Invalidate and refetch the query
          queryClient.invalidateQueries({ queryKey: ['seller-price-offers', user.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
        },
        (payload) => {
          console.log('Product status change detected:', payload);
          // If product status changed to sold, refresh price offers
          if (payload.new?.status === 'sold') {
            queryClient.invalidateQueries({ queryKey: ['seller-price-offers', user.id] });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription for seller price offers');
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return query;
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
