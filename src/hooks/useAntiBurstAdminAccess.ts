import { useRef, useCallback } from 'react';
import { useOptimizedAdminAccess } from './useOptimizedAdminAccess';

interface CacheEntry {
  result: boolean;
  timestamp: number;
}

/**
 * Anti-burst wrapper для verifyAdminAccess и других админских проверок
 * Предотвращает спам-вызовы в навигации по админке
 */
export const useAntiBurstAdminAccess = () => {
  const { isAdmin, isCheckingAdmin, hasAdminAccess } = useOptimizedAdminAccess();
  const cacheRef = useRef<CacheEntry | null>(null);
  
  const CACHE_DURATION_MS = 5000; // 5 секунд кэша для успешных проверок
  
  /**
   * Обёртка для любых админских API вызовов
   * Если в последние 5 сек уже был успешный результат - не повторяем
   */
  const withAntiBurst = useCallback(async <T>(
    operation: () => Promise<T>,
    options: {
      bypassCache?: boolean; // для мутаций
      operationName?: string; // для логирования
    } = {}
  ): Promise<T> => {
    const { bypassCache = false, operationName = 'unknown' } = options;
    const now = Date.now();
    
    // Проверяем кэш только для non-mutation операций
    if (!bypassCache && cacheRef.current) {
      const { result, timestamp } = cacheRef.current;
      const age = now - timestamp;
      
      if (age < CACHE_DURATION_MS && result) {
        console.log(`🚫 Anti-burst: Skipping ${operationName}, using cached result (${age}ms old)`);
        return result as T;
      }
    }
    
    try {
      console.log(`🔄 Anti-burst: Executing ${operationName}`);
      const result = await operation();
      
      // Кэшируем только успешные результаты админских проверок
      if (typeof result === 'boolean' && result) {
        cacheRef.current = { result, timestamp: now };
      }
      
      return result;
    } catch (error) {
      console.error(`❌ Anti-burst: ${operationName} failed:`, error);
      throw error;
    }
  }, []);
  
  /**
   * Очистка кэша (например, при логауте или смене пользователя)
   */
  const clearCache = useCallback(() => {
    cacheRef.current = null;
  }, []);
  
  /**
   * Проверка актуальности кэша
   */
  const isCacheValid = useCallback(() => {
    if (!cacheRef.current) return false;
    const age = Date.now() - cacheRef.current.timestamp;
    return age < CACHE_DURATION_MS;
  }, []);
  
  return {
    isAdmin,
    isCheckingAdmin,
    hasAdminAccess,
    withAntiBurst,
    clearCache,
    isCacheValid,
    // Готовые обёртки для типичных случаев
    safeAdminCheck: useCallback(() => {
      return withAntiBurst(
        async () => hasAdminAccess,
        { operationName: 'admin_access_check' }
      );
    }, [withAntiBurst, hasAdminAccess]),
  };
};