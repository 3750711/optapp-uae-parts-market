import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Product } from '@/types/product';
import { useEffect } from 'react';

export interface AuctionProduct extends Product {
  user_offer_price?: number;
  user_offer_status?: string;
  user_offer_created_at?: string;
  user_offer_expires_at?: string;
  max_other_offer?: number;
  is_user_leading?: boolean;
  has_pending_offer?: boolean;
}

export const useBuyerAuctionProducts = (statusFilter?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Real-time subscription for price offers
  useEffect(() => {
    if (!user) return;

    console.log('🔴 Setting up real-time subscription for price offers');

    const channel = supabase
      .channel('price-offers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'price_offers'
        },
        (payload) => {
          console.log('📡 Real-time price offer change:', payload);
          
          // Invalidate and refetch auction products when offers change
          queryClient.invalidateQueries({
            queryKey: ['buyer-auction-products', user.id, statusFilter]
          });
          
          // Also invalidate offer counts
          queryClient.invalidateQueries({
            queryKey: ['buyer-offer-counts', user.id]
          });
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    return () => {
      console.log('🔴 Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user, statusFilter, queryClient]);

  return useQuery({
    queryKey: ['buyer-auction-products', user?.id, statusFilter],
    queryFn: async (): Promise<AuctionProduct[]> => {
      if (!user) return [];

      console.log('🔍 Fetching buyer auction products with filter:', statusFilter);

      const { data: offerData, error } = await supabase
        .from('price_offers')
        .select(`
          product_id,
          offered_price,
          status,
          created_at,
          expires_at,
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
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching auction products:', error);
        throw error;
      }

      console.log('📊 Raw offer data:', offerData?.length || 0, 'offers');

      const productMap = new Map<string, AuctionProduct>();
      
      for (const offer of offerData || []) {
        const product = offer.products;
        if (!product) continue;

        const productId = product.id;
        const existingEntry = productMap.get(productId);
        
        if (!existingEntry || new Date(offer.created_at) > new Date(existingEntry.user_offer_created_at || '')) {
          productMap.set(productId, {
            ...product,
            user_offer_price: offer.offered_price,
            user_offer_status: offer.status,
            user_offer_created_at: offer.created_at,
            user_offer_expires_at: offer.expires_at,
            has_pending_offer: offer.status === 'pending'
          });
        }
      }

      let products = Array.from(productMap.values());

      if (statusFilter && statusFilter !== 'all') {
        products = products.filter(product => {
          switch (statusFilter) {
            case 'active':
              return product.user_offer_status === 'pending';
            case 'cancelled':
              return product.user_offer_status === 'cancelled';
            case 'completed':
              return ['expired', 'rejected', 'accepted'].includes(product.user_offer_status || '');
            default:
              return true;
          }
        });
      }

      const productIds = products.map(p => p.id);
      if (productIds.length > 0) {
        const { data: competitiveData, error: competitiveError } = await supabase.rpc('get_offers_batch', {
          p_product_ids: productIds,
          p_user_id: user.id,
        });

        if (!competitiveError && competitiveData) {
          const competitiveMap = new Map();
          for (const item of competitiveData) {
            competitiveMap.set(item.product_id, item);
          }

          products = products.map(product => {
            const competitiveInfo = competitiveMap.get(product.id);
            if (competitiveInfo) {
              return {
                ...product,
                is_user_leading: competitiveInfo.current_user_is_max || false,
                max_other_offer: competitiveInfo.max_offer_price || 0
              };
            }
            return {
              ...product,
              is_user_leading: false,
              max_other_offer: 0
            };
          });
        }
      }

      products.sort((a, b) => {
        const statusPriority = (status: string | undefined) => {
          switch (status) {
            case 'pending': return 1;
            case 'cancelled': return 2;
            case 'expired':
            case 'rejected':
            case 'accepted': return 3;
            default: return 4;
          }
        };

        const aPriority = statusPriority(a.user_offer_status);
        const bPriority = statusPriority(b.user_offer_status);

        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }

        const aTime = new Date(a.user_offer_created_at || '').getTime();
        const bTime = new Date(b.user_offer_created_at || '').getTime();
        return bTime - aTime;
      });

      console.log('✅ Processed auction products:', products.length);
      return products;
    },
    enabled: !!user,
    staleTime: 2000, // Reduced from 30 seconds to 2 seconds for fresher data
    refetchInterval: 5000, // Auto-refresh every 5 seconds
    refetchIntervalInBackground: true, // Continue refreshing in background
  });
};

// Hook to get offer counts for each status
export const useBuyerOfferCounts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['buyer-offer-counts', user?.id],
    queryFn: async () => {
      if (!user) return { active: 0, cancelled: 0, completed: 0, total: 0 };

      const { data, error } = await supabase
        .from('price_offers')
        .select('status, product_id, created_at')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const latestOffers = new Map<string, string>();
      for (const offer of data || []) {
        if (!latestOffers.has(offer.product_id)) {
          latestOffers.set(offer.product_id, offer.status);
        }
      }

      const statuses = Array.from(latestOffers.values());
      
      return {
        active: statuses.filter(s => s === 'pending').length,
        cancelled: statuses.filter(s => s === 'cancelled').length,
        completed: statuses.filter(s => ['expired', 'rejected', 'accepted'].includes(s)).length,
        total: statuses.length
      };
    },
    enabled: !!user,
    staleTime: 2000, // Reduced for more frequent updates
    refetchInterval: 5000, // Auto-refresh every 5 seconds
    refetchIntervalInBackground: true,
  });
};
