
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CreatePriceOfferData, PriceOffer, UpdatePriceOfferData } from '@/types/price-offer';
import { toast } from 'sonner';

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
  
  return useMutation({
    mutationFn: async (data: CreatePriceOfferData) => {
      const { data: result, error } = await supabase
        .from('price_offers')
        .insert({
          product_id: data.product_id,
          seller_id: data.seller_id,
          original_price: data.original_price,
          offered_price: data.offered_price,
          message: data.message,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        })
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-offer', data.product_id] });
      queryClient.invalidateQueries({ queryKey: ['competitive-offers', data.product_id] });
      toast.success('Предложение отправлено!');
    },
    onError: (error) => {
      console.error('Error creating offer:', error);
      toast.error('Ошибка при отправке предложения');
    },
  });
};

// Hook для обновления предложения цены
export const useUpdatePriceOffer = () => {
  const queryClient = useQueryClient();
  
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
      queryClient.invalidateQueries({ queryKey: ['user-offer', data.product_id] });
      queryClient.invalidateQueries({ queryKey: ['competitive-offers', data.product_id] });
      toast.success('Предложение обновлено!');
    },
    onError: (error) => {
      console.error('Error updating offer:', error);
      toast.error('Ошибка при обновлении предложения');
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
