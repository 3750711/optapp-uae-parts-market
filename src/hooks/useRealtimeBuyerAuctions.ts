
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Product } from '@/types/product';
import { useBatchOffersInvalidation } from '@/hooks/use-price-offers-batch';
import { usePusherOffers } from '@/hooks/usePusherOffers';

export interface AuctionProduct extends Product {
  user_offer_price?: number;
  user_offer_status?: string;
  user_offer_created_at?: string;
  user_offer_expires_at?: string;
  max_other_offer?: number;
  is_user_leading?: boolean;
  has_pending_offer?: boolean;
}

export const useRealtimeBuyerAuctions = (statusFilter?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { invalidateBatchOffers } = useBatchOffersInvalidation();
  
  // Use Pusher for real-time updates
  const { 
    connectionState, 
    realtimeEvents, 
    lastUpdateTime, 
    isConnected 
  } = usePusherOffers();

  const [freshDataIndicator, setFreshDataIndicator] = useState(false);

  // Main auction data query with reduced polling frequency (Pusher handles real-time)
  const queryResult = useQuery({
    queryKey: ['buyer-auction-products', user?.id, statusFilter],
    queryFn: async (): Promise<AuctionProduct[]> => {
      if (!user) return [];

      console.log('🔍 Fetching buyer auction products with filter:', statusFilter);

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

      if (error) throw error;

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

      // Get competitive data for active offers
      const activeProductIds = products
        .filter(p => p.user_offer_status === 'pending')
        .map(p => p.id);
        
      if (activeProductIds.length > 0) {
        const { data: competitiveData } = await supabase
          .from('price_offers')
          .select('product_id, offered_price, buyer_id')
          .in('product_id', activeProductIds)
          .eq('status', 'pending')
          .order('offered_price', { ascending: false });

        if (competitiveData) {
          const maxOffers = new Map<string, { max_price: number; user_is_max: boolean }>();
          
          for (const offer of competitiveData) {
            const current = maxOffers.get(offer.product_id);
            if (!current || offer.offered_price > current.max_price) {
              maxOffers.set(offer.product_id, {
                max_price: offer.offered_price,
                user_is_max: offer.buyer_id === user.id
              });
            }
          }

          products = products.map(product => {
            const competitiveInfo = maxOffers.get(product.id);
            if (competitiveInfo) {
              return {
                ...product,
                is_user_leading: competitiveInfo.user_is_max,
                max_other_offer: competitiveInfo.user_is_max ? 0 : competitiveInfo.max_price
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

      // Sort products by status priority
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
      
      // Flash indicator when new data arrives
      setFreshDataIndicator(true);
      setTimeout(() => setFreshDataIndicator(false), 1000);
      
      return products;
    },
    enabled: !!user,
    staleTime: 30000, // Increased stale time since Pusher handles real-time
    gcTime: 60000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: isConnected ? 60000 : 15000, // Reduced polling when connected to Pusher
  });

  // Force refresh function
  const forceRefresh = useCallback(async () => {
    console.log('🔄 Force refreshing auction data...');
    await queryClient.invalidateQueries({
      queryKey: ['buyer-auction-products'],
      exact: false,
      refetchType: 'all'
    });
  }, [queryClient]);

  return {
    ...queryResult,
    isConnected,
    lastUpdateTime,
    realtimeEvents,
    freshDataIndicator,
    forceRefresh,
    connectionState,
    getConnectionDiagnostics: () => ({ 
      pusher: isConnected, 
      polling: !isConnected,
      interval: isConnected ? 60000 : 15000,
      events: realtimeEvents.length
    })
  };
};

// Simplified buyer offer counts hook
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
    staleTime: 30000,
    gcTime: 60000,
    refetchInterval: 60000, // Reduced polling for counts
  });
};
