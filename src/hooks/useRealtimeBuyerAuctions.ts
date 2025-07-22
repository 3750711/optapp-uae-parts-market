
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Product } from '@/types/product';
import { RealtimeChannel } from '@supabase/supabase-js';

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
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Basic query for getting auction products
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
        // Get max offers for each product using direct query
        const { data: competitiveData } = await supabase
          .from('price_offers')
          .select('product_id, offered_price, buyer_id')
          .in('product_id', activeProductIds)
          .eq('status', 'pending')
          .order('offered_price', { ascending: false });

        if (competitiveData) {
          // Calculate max offers per product
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

          // Update products with competitive info
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
      setLastUpdateTime(new Date());
      return products;
    },
    enabled: !!user,
    staleTime: 1000,
    gcTime: 5000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: isConnected ? false : 5000 // Fallback polling if not connected
  });

  // Debounced invalidation для предотвращения частых обновлений
  const debouncedInvalidation = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (reason: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log(`🔄 Debounced: ${reason}`);
        queryClient.invalidateQueries({
          queryKey: ['buyer-auction-products'],
          exact: false
        });
      }, 300);
    };
  }, [queryClient]);

  // Улучшенная Realtime подписка с обработкой ошибок
  useEffect(() => {
    if (!user) {
      setIsConnected(false);
      return;
    }

    console.log('🔄 Setting up enhanced Realtime subscription for user:', user.id);

    const channel = supabase
      .channel(`auction_updates_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'price_offers',
          filter: `buyer_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📥 Realtime: MY offer update:', payload);
          setLastUpdateTime(new Date());
          debouncedInvalidation('Обновление моего предложения');
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `has_active_offers=eq.true`
        },
        (payload) => {
          const updatedProduct = payload.new as any;
          const currentProducts = queryResult.data || [];
          const productIds = currentProducts.map(p => p.id);
          
          if (productIds.includes(updatedProduct.id)) {
            console.log('📥 Realtime: Product offers update:', updatedProduct.id);
            setLastUpdateTime(new Date());
            debouncedInvalidation('Обновление предложений на продукт');
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime status:', status);
        setIsConnected(status === 'SUBSCRIBED');
        
        if (status === 'CLOSED') {
          console.warn('⚠️ Realtime соединение закрыто');
          setTimeout(() => {
            queryClient.invalidateQueries({
              queryKey: ['buyer-auction-products'],
              exact: false
            });
          }, 1000);
        }
      });

    channelRef.current = channel;

    return () => {
      console.log('🔌 Cleaning up Realtime subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, queryClient, debouncedInvalidation, queryResult.data]);

  // Force refresh function
  const forceRefresh = async () => {
    console.log('🔄 Force refreshing auction data...');
    await queryClient.invalidateQueries({
      queryKey: ['buyer-auction-products'],
      exact: false,
      refetchType: 'all'
    });
  };

  return {
    ...queryResult,
    isConnected,
    lastUpdateTime,
    forceRefresh
  };
};

// Hook for offer counts
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
    staleTime: 2000,
    gcTime: 10000,
  });
};
