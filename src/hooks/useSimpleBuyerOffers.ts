import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Product } from '@/types/product';

export interface SimpleOfferProduct extends Product {
  user_offer_price?: number;
  user_offer_status?: string;
  user_offer_created_at?: string;
  user_offer_expires_at?: string;
}

export const useSimpleBuyerOffers = (statusFilter?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const normalizedStatusFilter = useMemo(() => {
    return statusFilter || 'all';
  }, [statusFilter]);
  
  const queryKey = useMemo(() => 
    ['buyer-offers', user?.id, normalizedStatusFilter], 
    [user?.id, normalizedStatusFilter]
  );

  const queryResult = useQuery({
    queryKey,
    queryFn: async (): Promise<SimpleOfferProduct[]> => {
      if (!user) return [];

      console.log('🔍 Fetching buyer offers for user:', user.id, 'filter:', normalizedStatusFilter);

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
      const productMap = new Map<string, SimpleOfferProduct>();
      
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
            user_offer_expires_at: offer.expires_at
          });
        }
      }

      let products = Array.from(productMap.values());
      console.log('📦 Found products with offers:', products.length);

      // Apply status filter
      if (normalizedStatusFilter !== 'all') {
        products = products.filter(product => {
          switch (normalizedStatusFilter) {
            case 'active':
              return product.user_offer_status === 'pending';
            case 'completed':
              return ['expired', 'rejected', 'accepted'].includes(product.user_offer_status || '');
            default:
              return true;
          }
        });
      }

      // Sort products by status priority and creation time
      products.sort((a, b) => {
        const statusPriority = (status: string | undefined) => {
          switch (status) {
            case 'pending': return 1;
            case 'accepted': return 2;
            case 'rejected': return 3;
            case 'expired': return 4;
            default: return 5;
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

      console.log('✅ Final processed offer products:', products.length);
      return products;
    },
    enabled: !!user,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  const forceRefresh = useCallback(async () => {
    console.log('🔄 Force refreshing offer data...');
    await queryClient.invalidateQueries({
      queryKey: ['buyer-offers']
    });
  }, [queryClient]);

  return {
    ...queryResult,
    forceRefresh,
  };
};

export const useSimpleBuyerOfferCounts = () => {
  const { user } = useAuth();

  const queryKey = useMemo(() => 
    ['buyer-offer-counts', user?.id], 
    [user?.id]
  );

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return { active: 0, completed: 0, total: 0 };

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