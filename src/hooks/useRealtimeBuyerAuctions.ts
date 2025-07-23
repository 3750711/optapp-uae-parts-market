
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef, useCallback } from 'react';
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

// Кэш активных продуктов пользователя для быстрой проверки релевантности
const userActiveProductsCache = new Map<string, Set<string>>();

// Упрощенная и надежная функция проверки релевантности
const isRelevantUpdate = async (payload: any, userId: string) => {
  // Полное логирование payload для диагностики
  console.log('🔍 Full payload debug:', {
    eventType: payload.eventType,
    table: payload.table,
    schema: payload.schema,
    new: payload.new,
    old: payload.old,
    userId
  });

  const productId = payload.new?.product_id || payload.old?.product_id;
  const buyerId = payload.new?.buyer_id || payload.old?.buyer_id;
  
  if (!productId) {
    console.warn('⚠️ No product_id in payload');
    return false;
  }

  // Проверка 1: Прямое обновление предложения пользователя
  if (buyerId === userId) {
    console.log('✅ Relevant: Direct user offer update', { productId, userId, buyerId });
    return true;
  }

  // Проверка 2: Быстрая проверка через кэш (с fallback)
  const cachedProducts = userActiveProductsCache.get(userId);
  if (cachedProducts?.has(productId)) {
    console.log('✅ Relevant: User has cached active offer on this product', { productId, userId });
    return true;
  }

  // Проверка 3: Прямая проверка в БД (упрощенная, без зависимости от кэша)
  try {
    const { data, error } = await supabase
      .from('price_offers')
      .select('id, status')
      .eq('buyer_id', userId)
      .eq('product_id', productId)
      .eq('status', 'pending')
      .limit(1);

    if (error) {
      console.error('❌ Error in DB relevance check:', error);
      // В случае ошибки БД, считаем релевантным для безопасности
      return true;
    }

    const isRelevant = data && data.length > 0;
    
    // Обновляем кэш только в случае положительного результата
    if (isRelevant) {
      const userCache = userActiveProductsCache.get(userId) || new Set();
      userCache.add(productId);
      userActiveProductsCache.set(userId, userCache);
    }

    console.log('📊 DB relevance result:', { productId, userId, isRelevant, hasData: !!data?.length });
    return isRelevant;
  } catch (error) {
    console.error('❌ Exception in relevance check:', error);
    // В случае исключения, считаем релевантным для безопасности
    return true;
  }
};

// Функция для обновления кэша активных продуктов
const updateActiveProductsCache = (userId: string, products: AuctionProduct[]) => {
  const activeProductIds = products
    .filter(p => p.user_offer_status === 'pending')
    .map(p => p.id);
  
  userActiveProductsCache.set(userId, new Set(activeProductIds));
  console.log('🔄 Updated products cache:', { userId, activeCount: activeProductIds.length });
};

export const useRealtimeBuyerAuctions = (statusFilter?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [realtimeEvents, setRealtimeEvents] = useState<string[]>([]);
  const [freshDataIndicator, setFreshDataIndicator] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef<number>(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  // Стабильная функция invalidации без циклических зависимостей
  const invalidateQueries = useCallback((reason: string) => {
    console.log(`🔄 Invalidating queries: ${reason}`);
    setLastUpdateTime(new Date());
    setFreshDataIndicator(true);
    
    // Убираем индикатор свежих данных через 3 секунды
    setTimeout(() => setFreshDataIndicator(false), 3000);
    
    queryClient.invalidateQueries({
      queryKey: ['buyer-auction-products'],
      exact: false
    });
  }, [queryClient]);

  // Оптимизированная функция debounced invalidation
  const debouncedInvalidation = useCallback((() => {
    let timeoutId: NodeJS.Timeout;
    return (reason: string, delay: number = 100) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        invalidateQueries(reason);
      }, delay);
    };
  })(), [invalidateQueries]);

  // Основной запрос данных аукциона
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
      
      // Обновляем кэш активных продуктов
      updateActiveProductsCache(user.id, products);
      
      return products;
    },
    enabled: !!user,
    staleTime: 2000,
    gcTime: 10000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: isConnected ? false : 10000
  });

  // Функция переподключения
  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    reconnectAttemptsRef.current += 1;
    console.log(`🔄 Attempting to reconnect (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    }, 2000 * reconnectAttemptsRef.current);
  }, []);

  // Оптимизированная Real-time подписка
  useEffect(() => {
    if (!user) {
      setIsConnected(false);
      return;
    }

    console.log('🔄 Setting up optimized Realtime subscription for user:', user.id);

    const channel = supabase
      .channel(`auction_updates_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'price_offers'
        },
        async (payload) => {
          const startTime = Date.now();
          const productId = payload.new?.product_id || payload.old?.product_id;
          const buyerId = payload.new?.buyer_id || payload.old?.buyer_id;
          
          console.log('📡 Realtime event received:', {
            event: payload.eventType,
            productId,
            buyerId,
            timestamp: new Date().toISOString(),
            hasNewData: !!payload.new,
            hasOldData: !!payload.old
          });
          
          // Добавляем расширенное событие в дебаг список
          const eventDetails = `${payload.eventType}: ${productId} (buyer: ${buyerId?.slice(0,8)}...) at ${new Date().toLocaleTimeString()}`;
          setRealtimeEvents(prev => [eventDetails, ...prev.slice(0, 9)]);
          
          // Проверяем релевантность асинхронно
          const isRelevant = await isRelevantUpdate(payload, user.id);
          const processingTime = Date.now() - startTime;
          
          if (isRelevant) {
            // Определяем тип и приоритет обновления
            const isUserAction = buyerId === user.id;
            const isCompetitorAction = !isUserAction && (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE');
            const isCriticalUpdate = isCompetitorAction && payload.eventType === 'INSERT';
            
            // Оптимизированные задержки
            const delay = isCriticalUpdate ? 10 : isUserAction ? 20 : isCompetitorAction ? 30 : 100;
            
            console.log(`⚡ Processing relevant update:`, {
              productId,
              isUserAction,
              isCompetitorAction,
              isCriticalUpdate,
              delay,
              processingTime,
              eventType: payload.eventType
            });
            
            debouncedInvalidation(`${payload.eventType} on product ${productId}`, delay);
          } else {
            console.log(`⏭️ Skipped irrelevant update (${processingTime}ms):`, {
              productId,
              buyerId,
              eventType: payload.eventType
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime connection status:', status);
        setIsConnected(status === 'SUBSCRIBED');
        
        if (status === 'SUBSCRIBED') {
          reconnectAttemptsRef.current = 0;
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Global channel error, attempting to reconnect...');
          handleReconnect();
        } else if (status === 'CLOSED') {
          console.warn('⚠️ Realtime connection closed, triggering refresh');
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
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user?.id, queryClient, debouncedInvalidation, handleReconnect]);

  // Принудительное обновление
  const forceRefresh = useCallback(async () => {
    console.log('🔄 Force refreshing auction data...');
    if (user) {
      // Очищаем кэш для пользователя
      userActiveProductsCache.delete(user.id);
    }
    await queryClient.invalidateQueries({
      queryKey: ['buyer-auction-products'],
      exact: false,
      refetchType: 'all'
    });
  }, [queryClient, user]);

  return {
    ...queryResult,
    isConnected,
    lastUpdateTime,
    realtimeEvents,
    freshDataIndicator,
    forceRefresh
  };
};

// Hook для подсчета предложений (без изменений)
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
