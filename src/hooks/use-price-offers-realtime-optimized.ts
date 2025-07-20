
import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBatchOffersInvalidation } from "./use-price-offers-batch";
import { usePerformanceMonitor } from './use-performance-monitor';
import { useABTest } from './use-ab-test';

interface UseGlobalRealTimePriceOffersProps {
  enabled: boolean;
  userId?: string;
}

// Оптимизированный global real-time hook для всех price offers
export const useGlobalRealTimePriceOffers = ({ 
  enabled, 
  userId 
}: UseGlobalRealTimePriceOffersProps) => {
  const queryClient = useQueryClient();
  const { invalidateBatchOffers } = useBatchOffersInvalidation();
  const { recordRealTimeUpdate, startDebounce, endDebounce } = usePerformanceMonitor();
  const { getCurrentDebounceTime, recordInteraction } = useABTest();
  const channelRef = useRef<any>(null);
  const lastUpdateRef = useRef<number>(0);
  const pendingUpdatesRef = useRef<Set<string>>(new Set());
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef<number>(0);
  
  // Динамическое время debounce из A/B теста
  const DEBOUNCE_MS = getCurrentDebounceTime();
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 2000; // 2 секунды между попытками

  const processPendingUpdates = useCallback(() => {
    const startTime = performance.now();
    const productIds = Array.from(pendingUpdatesRef.current);
    if (productIds.length === 0) return;

    console.log('🚀 Processing optimized real-time updates for products:', productIds);
    
    endDebounce(); // End debounce measurement
    
    // Селективная инвалидация только для затронутых продуктов
    invalidateBatchOffers(productIds);
    
    // Также инвалидируем пользовательские списки предложений если userId доступен
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ["buyer-price-offers"] });
      queryClient.invalidateQueries({ queryKey: ["seller-price-offers"] });
    }
    
    // Очищаем pending updates
    pendingUpdatesRef.current.clear();
    lastUpdateRef.current = Date.now();
    
    // Record performance metrics
    const endTime = performance.now();
    recordRealTimeUpdate(endTime - startTime);
    recordInteraction('ui_interaction', { 
      type: 'realtime_batch_update', 
      productCount: productIds.length 
    });
  }, [invalidateBatchOffers, queryClient, userId, recordRealTimeUpdate, recordInteraction, endDebounce]);

  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.error('❌ Max reconnection attempts reached for global price offers');
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
      // Повторная инициализация произойдет через useEffect
    }, RECONNECT_DELAY * reconnectAttemptsRef.current); // Экспоненциальная задержка
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Очистка существующих каналов
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channelName = `global-price-offers-realtime-${Date.now()}`;
    console.log(`🔄 Setting up optimized global real-time channel: ${channelName}`);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'price_offers'
        },
        (payload) => {
          const now = Date.now();
          
          // Извлечение product_id из payload
          const productId = payload.new?.product_id || payload.old?.product_id;
          if (!productId) return;

          console.log('⚡ Fast real-time price offers update:', {
            event: payload.eventType,
            productId,
            userId,
            timestamp: now
          });

          // Добавляем в pending updates для batch обработки
          pendingUpdatesRef.current.add(productId);

          // Throttle обновлений для предотвращения spam
          const timeSinceLastUpdate = now - lastUpdateRef.current;
          if (timeSinceLastUpdate < 100) { // Minimum 100ms между обновлениями
            return;
          }

          // Очистка существующего debounce timer
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }

          // Быстрое обновление для критичных случаев
          debounceTimerRef.current = setTimeout(() => {
            processPendingUpdates();
          }, DEBOUNCE_MS);
        }
      )
      .subscribe((status) => {
        console.log(`🔄 Optimized real-time subscription status:`, status);
        
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Successfully subscribed to optimized price offers updates`);
          reconnectAttemptsRef.current = 0; // Сброс счетчика попыток при успешном подключении
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Global channel error, attempting to reconnect...`);
          handleReconnect();
        } else if (status === 'CLOSED') {
          console.log(`🔄 Channel closed`);
        }
      });

    channelRef.current = channel;

    return () => {
      console.log(`🔄 Cleaning up optimized global real-time channel`);
      
      // Очистка всех таймеров
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Обработка pending updates перед cleanup
      if (pendingUpdatesRef.current.size > 0) {
        processPendingUpdates();
      }
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, userId, processPendingUpdates, handleReconnect]);

  return {
    isConnected: channelRef.current?.state === 'subscribed',
    reconnectAttempts: reconnectAttemptsRef.current
  };
};

// Legacy hook для обратной совместимости - теперь использует global channel
export const useOptimizedRealTimePriceOffers = ({ 
  productId, 
  enabled, 
  userId 
}: {
  productId: string;
  enabled: boolean;
  userId?: string;
}) => {
  // Используем global real-time вместо per-product channels для лучшей производительности
  return useGlobalRealTimePriceOffers({ enabled: enabled && !!productId, userId });
};
