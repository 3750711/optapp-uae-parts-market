
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Product } from '@/types/product';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useBatchOffersInvalidation } from '@/hooks/use-price-offers-batch';
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor';

export interface AuctionProduct extends Product {
  user_offer_price?: number;
  user_offer_status?: string;
  user_offer_created_at?: string;
  user_offer_expires_at?: string;
  max_other_offer?: number;
  is_user_leading?: boolean;
  has_pending_offer?: boolean;
}

// Optimized cache for user's active products
const userActiveProductsCache = new Map<string, Set<string>>();

// Connection state manager
class ConnectionStateManager {
  private static instance: ConnectionStateManager;
  private connections = new Map<string, RealtimeChannel>();
  private connectionStates = new Map<string, boolean>();
  
  static getInstance(): ConnectionStateManager {
    if (!ConnectionStateManager.instance) {
      ConnectionStateManager.instance = new ConnectionStateManager();
    }
    return ConnectionStateManager.instance;
  }
  
  addConnection(key: string, channel: RealtimeChannel): void {
    // Clean up existing connection if any
    const existing = this.connections.get(key);
    if (existing) {
      console.log(`🔄 Replacing existing connection for ${key}`);
      supabase.removeChannel(existing);
    }
    
    this.connections.set(key, channel);
    this.connectionStates.set(key, false);
  }
  
  removeConnection(key: string): void {
    const channel = this.connections.get(key);
    if (channel) {
      console.log(`🔌 Removing connection for ${key}`);
      supabase.removeChannel(channel);
      this.connections.delete(key);
      this.connectionStates.delete(key);
    }
  }
  
  setConnectionState(key: string, isConnected: boolean): void {
    this.connectionStates.set(key, isConnected);
  }
  
  getConnectionState(key: string): boolean {
    return this.connectionStates.get(key) || false;
  }
  
  getAllConnections(): Map<string, boolean> {
    return new Map(this.connectionStates);
  }
  
  cleanup(): void {
    console.log('🧹 Cleaning up all connections');
    this.connections.forEach((channel, key) => {
      console.log(`🔌 Removing connection: ${key}`);
      supabase.removeChannel(channel);
    });
    this.connections.clear();
    this.connectionStates.clear();
  }
}

// Enhanced relevance check with performance monitoring
const isRelevantUpdate = async (payload: any, userId: string, recordRealTimeUpdate: (duration: number) => void) => {
  const startTime = performance.now();
  
  console.log('🔍 Enhanced relevance check:', {
    eventType: payload.eventType,
    table: payload.table,
    hasNew: !!payload.new,
    hasOld: !!payload.old,
    userId
  });

  const productId = payload.new?.product_id || payload.old?.product_id;
  const buyerId = payload.new?.buyer_id || payload.old?.buyer_id;
  
  if (!productId) {
    console.warn('⚠️ No product_id in payload');
    recordRealTimeUpdate(performance.now() - startTime);
    return false;
  }

  // Direct user offer update - highest priority
  if (buyerId === userId) {
    console.log('✅ Relevant: Direct user offer update', { productId, userId, buyerId });
    recordRealTimeUpdate(performance.now() - startTime);
    return true;
  }

  // Fast cache check
  const cachedProducts = userActiveProductsCache.get(userId);
  if (cachedProducts?.has(productId)) {
    console.log('✅ Relevant: User has cached active offer', { productId, userId });
    recordRealTimeUpdate(performance.now() - startTime);
    return true;
  }

  // Database check with error handling
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
      recordRealTimeUpdate(performance.now() - startTime);
      return true; // Safe fallback
    }

    const isRelevant = data && data.length > 0;
    
    // Update cache for positive results
    if (isRelevant) {
      const userCache = userActiveProductsCache.get(userId) || new Set();
      userCache.add(productId);
      userActiveProductsCache.set(userId, userCache);
    }

    console.log('📊 DB relevance result:', { 
      productId, 
      userId, 
      isRelevant, 
      hasData: !!data?.length,
      checkTime: performance.now() - startTime
    });
    
    recordRealTimeUpdate(performance.now() - startTime);
    return isRelevant;
  } catch (error) {
    console.error('❌ Exception in relevance check:', error);
    recordRealTimeUpdate(performance.now() - startTime);
    return true; // Safe fallback
  }
};

// Update cache helper
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
  const { invalidateBatchOffers } = useBatchOffersInvalidation();
  const { recordRealTimeUpdate } = usePerformanceMonitor();
  const connectionManager = ConnectionStateManager.getInstance();
  
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [realtimeEvents, setRealtimeEvents] = useState<string[]>([]);
  const [freshDataIndicator, setFreshDataIndicator] = useState(false);
  
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const pendingUpdatesRef = useRef<Set<string>>(new Set());
  
  const MAX_RECONNECT_ATTEMPTS = 5;
  const DEBOUNCE_MS = 150;
  const BASE_RECONNECT_DELAY = 1000;
  const MAX_RECONNECT_DELAY = 30000;

  // Enhanced batch invalidation with performance monitoring
  const processPendingUpdates = useCallback(() => {
    const startTime = performance.now();
    const productIds = Array.from(pendingUpdatesRef.current);
    
    if (productIds.length === 0) return;

    console.log('🚀 Processing batch updates for products:', productIds);
    
    // Batch invalidate offers
    invalidateBatchOffers(productIds);
    
    // Update UI state
    setLastUpdateTime(new Date());
    setFreshDataIndicator(true);
    setTimeout(() => setFreshDataIndicator(false), 3000);
    
    // Invalidate auction queries
    queryClient.invalidateQueries({
      queryKey: ['buyer-auction-products'],
      exact: false
    });
    
    // Clear pending updates
    pendingUpdatesRef.current.clear();
    
    // Record performance metrics
    recordRealTimeUpdate(performance.now() - startTime);
    
    console.log('✅ Batch update completed in', performance.now() - startTime, 'ms');
  }, [invalidateBatchOffers, queryClient, recordRealTimeUpdate]);

  // Fixed reconnection logic with exponential backoff
  const handleReconnect = useCallback(() => {
    if (!user) return;
    
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('❌ Max reconnection attempts reached, switching to polling mode');
      setIsConnected(false);
      return;
    }

    reconnectAttemptsRef.current += 1;
    const delay = Math.min(
      BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current - 1),
      MAX_RECONNECT_DELAY
    );
    
    console.log(`🔄 Reconnecting (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}) in ${delay}ms`);

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log('🔄 Executing reconnection attempt');
      
      // Remove old connection
      const connectionKey = `buyer_auctions_${user.id}`;
      connectionManager.removeConnection(connectionKey);
      
      // Create new connection
      setupRealtimeConnection();
    }, delay);
  }, [user]);

  // Setup realtime connection function
  const setupRealtimeConnection = useCallback(() => {
    if (!user) return;

    const connectionKey = `buyer_auctions_${user.id}`;
    
    console.log('🔄 Setting up enhanced Real-time subscription for user:', user.id);

    const channel = supabase
      .channel(`enhanced_buyer_auctions_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'price_offers'
        },
        async (payload) => {
          const productId = payload.new?.product_id || payload.old?.product_id;
          const buyerId = payload.new?.buyer_id || payload.old?.buyer_id;
          
          console.log('📡 Enhanced Real-time event:', {
            event: payload.eventType,
            productId,
            buyerId,
            timestamp: new Date().toISOString()
          });
          
          // Add to events log
          const eventDetails = `${payload.eventType}: ${productId?.slice(0,8)}... (${buyerId?.slice(0,8)}...) at ${new Date().toLocaleTimeString()}`;
          setRealtimeEvents(prev => [eventDetails, ...prev.slice(0, 9)]);
          
          // Check relevance with performance monitoring
          const isRelevant = await isRelevantUpdate(payload, user.id, recordRealTimeUpdate);
          
          if (isRelevant) {
            // Add to pending updates for batch processing
            pendingUpdatesRef.current.add(productId);
            
            // Clear existing debounce timer
            if (debounceTimerRef.current) {
              clearTimeout(debounceTimerRef.current);
            }
            
            // Set new debounce timer
            debounceTimerRef.current = setTimeout(() => {
              processPendingUpdates();
            }, DEBOUNCE_MS);
            
            console.log(`⚡ Queued for batch processing: ${productId}`);
          } else {
            console.log(`⏭️ Skipped irrelevant update: ${productId}`);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Enhanced Real-time status:', status);
        const isNowConnected = status === 'SUBSCRIBED';
        setIsConnected(isNowConnected);
        connectionManager.setConnectionState(connectionKey, isNowConnected);
        
        if (status === 'SUBSCRIBED') {
          reconnectAttemptsRef.current = 0;
          console.log('✅ Successfully connected to Real-time');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel error, attempting reconnect...');
          setIsConnected(false);
          connectionManager.setConnectionState(connectionKey, false);
          handleReconnect();
        } else if (status === 'CLOSED') {
          console.warn('⚠️ Connection closed, switching to polling mode');
          setIsConnected(false);
          connectionManager.setConnectionState(connectionKey, false);
          // Don't immediately reconnect on CLOSED status - might be intentional
        }
      });

    connectionManager.addConnection(connectionKey, channel);
  }, [user, handleReconnect, processPendingUpdates, recordRealTimeUpdate]);

  // Main auction data query
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
      
      // Update cache
      updateActiveProductsCache(user.id, products);
      
      return products;
    },
    enabled: !!user,
    staleTime: 1000,
    gcTime: 5000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: isConnected ? false : 10000
  });

  // Enhanced Real-time subscription with proper connection management
  useEffect(() => {
    if (!user) {
      setIsConnected(false);
      return;
    }

    setupRealtimeConnection();

    return () => {
      console.log('🔌 Cleaning up enhanced Real-time subscription');
      
      // Process any pending updates before cleanup
      if (pendingUpdatesRef.current.size > 0) {
        processPendingUpdates();
      }
      
      // Clear timers
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Remove connection through manager
      const connectionKey = `buyer_auctions_${user.id}`;
      connectionManager.removeConnection(connectionKey);
    };
  }, [user?.id, setupRealtimeConnection, processPendingUpdates]);

  // Force refresh function
  const forceRefresh = useCallback(async () => {
    console.log('🔄 Force refreshing auction data...');
    if (user) {
      userActiveProductsCache.delete(user.id);
    }
    await queryClient.invalidateQueries({
      queryKey: ['buyer-auction-products'],
      exact: false,
      refetchType: 'all'
    });
  }, [queryClient, user]);

  // Connection diagnostics
  const getConnectionDiagnostics = useCallback(() => {
    const connectionKey = `buyer_auctions_${user?.id}`;
    const allConnections = connectionManager.getAllConnections();
    
    return {
      currentConnection: connectionManager.getConnectionState(connectionKey),
      allConnections: Object.fromEntries(allConnections),
      reconnectAttempts: reconnectAttemptsRef.current,
      lastUpdateTime,
      eventsCount: realtimeEvents.length
    };
  }, [user?.id, lastUpdateTime, realtimeEvents.length]);

  return {
    ...queryResult,
    isConnected,
    lastUpdateTime,
    realtimeEvents,
    freshDataIndicator,
    forceRefresh,
    getConnectionDiagnostics
  };
};

// Optimized buyer offer counts hook
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
    staleTime: 1000,
    gcTime: 5000,
  });
};
