
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Product } from '@/types/product';
import { usePusherRealtime } from './usePusherRealtime';

export interface AuctionProduct extends Product {
  user_offer_price?: number;
  user_offer_status?: string;
  user_offer_created_at?: string;
  user_offer_expires_at?: string;
  max_other_offer?: number;
  is_user_leading?: boolean;
  has_pending_offer?: boolean;
  offers_count?: number;
}

export interface CompetitiveOfferData {
  product_id: string;
  max_offer_price: number;
  current_user_is_max: boolean;
  total_offers_count: number;
  current_user_offer_price: number;
  user_has_pending_offer: boolean;
}

export const useRealtimeBuyerAuctions = (statusFilter?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Use Pusher real-time system
  const { 
    connectionState, 
    realtimeEvents, 
    lastUpdateTime, 
    isConnected,
    forceReconnect
  } = usePusherRealtime();

  // Main auction data query with proper competitive data
  const queryResult = useQuery({
    queryKey: ['buyer-auction-products', user?.id, statusFilter],
    queryFn: async (): Promise<AuctionProduct[]> => {
      if (!user) return [];

      console.log('🔍 Fetching buyer auction products for user:', user.id);

      // Get user's price offers with product data
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
        console.error('❌ Error fetching offers:', error);
        throw error;
      }

      // Process offers into products map
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
      console.log('📦 Found products with offers:', products.length);

      // Apply status filter
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

      // Get competitive data for all products using the database function
      if (products.length > 0) {
        const productIds = products.map(p => p.id);
        
        console.log('🏆 Getting competitive data for products:', productIds.length);

        // Use the corrected database function for competitive data
        const { data: competitiveData, error: compError } = await supabase
          .rpc('get_offers_batch', {
            p_product_ids: productIds,
            p_user_id: user.id
          });

        if (compError) {
          console.error('❌ Error fetching competitive data:', compError);
        } else {
          console.log('✅ Competitive data received:', competitiveData?.length || 0);
          
          // Type the competitive data properly
          const typedCompetitiveData = competitiveData as CompetitiveOfferData[] || [];
          
          // Create a map for quick lookup
          const competitiveMap = new Map(
            typedCompetitiveData.map(item => [item.product_id, item])
          );

          // Update products with competitive data
          products = products.map(product => {
            const compData = competitiveMap.get(product.id);
            if (compData) {
              console.log(`📊 Product ${product.id} competitive data:`, {
                title: product.title,
                userPrice: product.user_offer_price,
                maxOtherPrice: compData.max_offer_price,
                isUserLeading: compData.current_user_is_max,
                totalOffers: compData.total_offers_count
              });
              
              return {
                ...product,
                max_other_offer: compData.max_offer_price,
                is_user_leading: compData.current_user_is_max,
                offers_count: compData.total_offers_count
              };
            }
            return {
              ...product,
              max_other_offer: 0,
              is_user_leading: false,
              offers_count: 0
            };
          });
        }
      }

      // Sort products by status priority and creation time
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

      console.log('✅ Final processed auction products:', products.length);
      return products;
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  // Force refresh function
  const forceRefresh = useCallback(async () => {
    console.log('🔄 Force refreshing auction data...');
    await queryClient.invalidateQueries({
      queryKey: ['buyer-auction-products']
    });
    await queryClient.invalidateQueries({
      queryKey: ['buyer-offer-counts']
    });
    await queryClient.invalidateQueries({
      queryKey: ['batch-offers']
    });
  }, [queryClient]);

  return {
    ...queryResult,
    isConnected,
    lastUpdateTime,
    realtimeEvents,
    forceRefresh,
    connectionState,
  };
};

// Simplified buyer offer counts hook
export const useBuyerOfferCounts = () => {
  const { user } = useAuth();
  const { lastUpdateTime } = usePusherRealtime();

  return useQuery({
    queryKey: ['buyer-offer-counts', user?.id],
    queryFn: async () => {
      if (!user) return { active: 0, cancelled: 0, completed: 0, total: 0 };

      console.log('🔢 Fetching buyer offer counts');

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
      
      const counts = {
        active: statuses.filter(s => s === 'pending').length,
        cancelled: statuses.filter(s => s === 'cancelled').length,
        completed: statuses.filter(s => ['expired', 'rejected', 'accepted'].includes(s)).length,
        total: statuses.length
      };

      console.log('✅ Buyer offer counts:', counts);
      return counts;
    },
    enabled: !!user,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
