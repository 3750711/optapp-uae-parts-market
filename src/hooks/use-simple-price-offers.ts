
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SimpleOfferData {
  product_id: string;
  max_offer_price: number;
  current_user_offer_price: number;
  has_pending_offer: boolean;
  total_offers_count: number;
}

interface CreateOfferData {
  product_id: string;
  seller_id: string;
  original_price: number;
  offered_price: number;
  message?: string;
}

// Простой хук для получения информации о предложениях для продукта
export const useSimpleProductOffers = (productId: string) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['simple-offers', productId, user?.id],
    queryFn: async (): Promise<SimpleOfferData> => {
      console.log('🔍 Fetching simple offers for product:', productId);

      // Получаем все предложения для продукта
      const { data: offers, error } = await supabase
        .from('price_offers')
        .select('offered_price, buyer_id, status')
        .eq('product_id', productId)
        .eq('status', 'pending');

      if (error) {
        console.error('❌ Error fetching offers:', error);
        throw error;
      }

      // Находим максимальное предложение
      const maxOffer = offers?.reduce((max, offer) => 
        offer.offered_price > max ? offer.offered_price : max, 0
      ) || 0;

      // Находим предложение текущего пользователя
      const userOffer = offers?.find(offer => offer.buyer_id === user?.id);

      console.log('✅ Simple offers fetched:', {
        maxOffer,
        userOffer: userOffer?.offered_price || 0,
        totalOffers: offers?.length || 0
      });

      return {
        product_id: productId,
        max_offer_price: maxOffer,
        current_user_offer_price: userOffer?.offered_price || 0,
        has_pending_offer: !!userOffer,
        total_offers_count: offers?.length || 0
      };
    },
    enabled: !!productId,
    staleTime: 5000, // 5 секунд
    refetchOnWindowFocus: true,
  });
};

// Простой хук для создания/обновления предложений
export const useSimpleCreateOffer = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateOfferData) => {
      console.log('🚀 Creating/updating simple offer:', data);

      if (!user) throw new Error('User not authenticated');

      // Проверяем существующее предложение
      const { data: existingOffer } = await supabase
        .from('price_offers')
        .select('id')
        .eq('product_id', data.product_id)
        .eq('buyer_id', user.id)
        .eq('status', 'pending')
        .single();

      if (existingOffer) {
        // Обновляем существующее предложение
        const { data: result, error } = await supabase
          .from('price_offers')
          .update({
            offered_price: data.offered_price,
            message: data.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingOffer.id)
          .select()
          .single();

        if (error) throw error;
        return result;
      } else {
        // Создаем новое предложение
        const { data: result, error } = await supabase
          .from('price_offers')
          .insert({
            product_id: data.product_id,
            buyer_id: user.id,
            seller_id: data.seller_id,
            original_price: data.original_price,
            offered_price: data.offered_price,
            message: data.message,
            status: 'pending'
          })
          .select()
          .single();

        if (error) throw error;
        return result;
      }
    },
    onSuccess: (_, variables) => {
      // Обновляем кеш
      queryClient.invalidateQueries({ 
        queryKey: ['simple-offers', variables.product_id] 
      });
      
      toast({
        title: "Предложение отправлено",
        description: "Ваше предложение успешно отправлено",
      });
    },
    onError: (error: any) => {
      console.error('❌ Error creating offer:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отправить предложение",
        variant: "destructive",
      });
    }
  });
};
