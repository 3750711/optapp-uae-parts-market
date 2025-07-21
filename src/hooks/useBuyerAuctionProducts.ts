
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Product } from '@/types/product';

export interface AuctionProduct extends Product {
  user_offer_price?: number;
  user_offer_status?: string;
  max_other_offer?: number;
  is_user_leading?: boolean;
  has_pending_offer?: boolean;
}

export const useBuyerAuctionProducts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['buyer-auction-products', user?.id],
    queryFn: async (): Promise<AuctionProduct[]> => {
      if (!user) return [];

      // Получаем товары где пользователь участвует в торгах
      const { data, error } = await supabase
        .from('price_offers')
        .select(`
          product_id,
          offered_price,
          status,
          products!inner (
            id,
            title,
            brand,
            model,
            price,
            condition,
            seller_id,
            seller_name,
            status,
            lot_number,
            place_number,
            delivery_price,
            created_at,
            updated_at,
            rating_seller,
            product_location,
            cloudinary_url,
            cloudinary_public_id,
            phone_url,
            telegram_url,
            product_images (
              id,
              url,
              is_primary,
              product_id
            ),
            product_videos (
              id,
              url,
              product_id
            )
          )
        `)
        .eq('buyer_id', user.id)
        .eq('products.status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching auction products:', error);
        throw error;
      }

      // Группируем по товарам и получаем дополнительную информацию о торгах
      const productMap = new Map<string, AuctionProduct>();
      
      for (const offer of data || []) {
        const product = offer.products;
        if (!product) continue;

        const productId = product.id;
        
        if (!productMap.has(productId)) {
          productMap.set(productId, {
            ...product,
            user_offer_price: offer.offered_price,
            user_offer_status: offer.status,
            has_pending_offer: offer.status === 'pending'
          });
        }
      }

      // Получаем информацию о конкурентных предложениях
      const productIds = Array.from(productMap.keys());
      if (productIds.length === 0) return [];

      const { data: competitiveData, error: competitiveError } = await supabase
        .from('price_offers')
        .select('product_id, offered_price, buyer_id')
        .in('product_id', productIds)
        .eq('status', 'pending');

      if (competitiveError) {
        console.error('Error fetching competitive offers:', competitiveError);
      }

      // Обновляем информацию о конкурентных предложениях
      const competitiveMap = new Map<string, { maxOffer: number; userIsLeading: boolean }>();
      
      for (const offer of competitiveData || []) {
        const productId = offer.product_id;
        const isUserOffer = offer.buyer_id === user.id;
        
        if (!competitiveMap.has(productId)) {
          competitiveMap.set(productId, { maxOffer: 0, userIsLeading: false });
        }
        
        const current = competitiveMap.get(productId)!;
        if (offer.offered_price > current.maxOffer) {
          current.maxOffer = offer.offered_price;
          current.userIsLeading = isUserOffer;
        }
      }

      // Обновляем продукты с информацией о конкурентных предложениях
      const result = Array.from(productMap.values()).map(product => ({
        ...product,
        is_user_leading: competitiveMap.get(product.id)?.userIsLeading || false,
        max_other_offer: competitiveMap.get(product.id)?.maxOffer || 0
      }));

      return result;
    },
    enabled: !!user,
    staleTime: 30000, // 30 секунд
    refetchInterval: 60000, // 1 минута
  });
};
