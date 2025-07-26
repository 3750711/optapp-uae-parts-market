import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CreatePriceOfferData, PriceOffer, UpdatePriceOfferData } from '@/types/price-offer';
import { toast } from 'sonner';
import { useBatchOffersInvalidation } from './use-price-offers-batch';

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

      // Сначала проверяем, есть ли у пользователя pending предложение для этого товара
      const { data: existingOffer, error: checkError } = await supabase
        .from('price_offers')
        .select('id, status')
        .eq('product_id', data.product_id)
        .eq('buyer_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing offer:', checkError);
        throw checkError;
      }

      // Если есть существующее pending предложение, обновляем его
      if (existingOffer) {
        const { data: result, error: updateError } = await supabase
          .from('price_offers')
          .update({
            offered_price: data.offered_price,
            message: data.message,
            original_price: data.original_price,
            delivery_method: data.delivery_method,
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
      const { data: result, error } = await supabase
        .from('price_offers')
        .update(data)
        .eq('id', offerId)
        .select()
        .single();
      
      if (error) throw error;
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
      console.error('Error updating offer:', error);
      toast.error('Error updating offer');
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

// Hook для получения предложений покупателя
export const useBuyerPriceOffers = () => {
  const { user } = useAuth();
  
  return useQuery({
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
};

// Hook для получения предложений продавца
export const useSellerPriceOffers = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['seller-price-offers', user?.id],
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
          buyer_profile:profiles!buyer_id(
            id,
            full_name,
            opt_id,
            telegram
          )
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PriceOffer[];
    },
    enabled: !!user?.id,
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
