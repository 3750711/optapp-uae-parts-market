import { clearAuthStorageSafe } from '@/auth/clearAuthStorage';

/**
 * Очищает auth storage при критических ошибках
 */
export function clearAuthOnCORSError() {
  try {
    console.warn('🧹 Clearing auth storage due to CORS errors');
    clearAuthStorageSafe();
    
    // Дополнительная очистка для PWA
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (cacheName.includes('supabase') || cacheName.includes('auth')) {
            caches.delete(cacheName);
          }
        });
      });
    }
  } catch (error) {
    console.warn('Failed to clear auth storage:', error);
  }
}