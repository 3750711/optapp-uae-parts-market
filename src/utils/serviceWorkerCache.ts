// Service Worker registration and cache management
export class ServiceWorkerCache {
  private static instance: ServiceWorkerCache;
  private registration: ServiceWorkerRegistration | null = null;

  static getInstance(): ServiceWorkerCache {
    if (!ServiceWorkerCache.instance) {
      ServiceWorkerCache.instance = new ServiceWorkerCache();
    }
    return ServiceWorkerCache.instance;
  }

  async register(): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return false;
    }

    try {
      // Only register in production or when explicitly enabled
      if (import.meta.env.PROD || localStorage.getItem('enableSW') === 'true') {
        this.registration = await navigator.serviceWorker.register('/sw-cache.js', {
          scope: '/'
        });

        console.log('Service Worker registered:', this.registration);

        // Listen for updates
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration?.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New Service Worker available, consider refreshing');
              }
            });
          }
        });

        return true;
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }

    return false;
  }

  async unregister(): Promise<boolean> {
    if (this.registration) {
      const result = await this.registration.unregister();
      this.registration = null;
      return result;
    }
    return false;
  }

  async clearCache(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('All caches cleared');
    }
  }

  async getCacheStats(): Promise<{ size: number; entries: number }> {
    if (!('caches' in window)) {
      return { size: 0, entries: 0 };
    }

    try {
      const cache = await caches.open('cloudinary-images-v1');
      const keys = await cache.keys();
      
      let totalSize = 0;
      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const buffer = await response.arrayBuffer();
          totalSize += buffer.byteLength;
        }
      }

      return {
        size: totalSize,
        entries: keys.length
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { size: 0, entries: 0 };
    }
  }

  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }
}

// Auto-register service worker
if (typeof window !== 'undefined') {
  const swCache = ServiceWorkerCache.getInstance();
  swCache.register().catch(console.error);
}