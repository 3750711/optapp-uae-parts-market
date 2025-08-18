// Service Worker registration and lifecycle management
interface ServiceWorkerManager {
  register(): Promise<ServiceWorkerRegistration | null>;
  unregister(): Promise<boolean>;
  update(): Promise<void>;
  getRegistration(): Promise<ServiceWorkerRegistration | undefined>;
}

class PWAServiceWorkerManager implements ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateAvailable = false;

  async register(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('🚫 SW: Service Worker not supported');
      return null;
    }

    try {
      console.log('🔧 SW: Registering...');
      
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      });

      console.log('✅ SW: Registered successfully', this.registration);

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          console.log('🔄 SW: Update found');
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('✨ SW: New version available');
              this.updateAvailable = true;
              this.notifyUpdateAvailable();
            }
          });
        }
      });

      // Handle messages from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, payload } = event.data || {};
        console.log('📱 SW: Message received', { type, payload });
      });

      // Auto-update check every 30 minutes
      setInterval(() => {
        this.checkForUpdates();
      }, 30 * 60 * 1000);

      return this.registration;
    } catch (error) {
      console.error('❌ SW: Registration failed', error);
      return null;
    }
  }

  async unregister(): Promise<boolean> {
    if (!this.registration) return false;
    
    try {
      const result = await this.registration.unregister();
      console.log('🗑️ SW: Unregistered', result);
      return result;
    } catch (error) {
      console.error('❌ SW: Unregistration failed', error);
      return false;
    }
  }

  async update(): Promise<void> {
    if (!this.registration) return;
    
    try {
      await this.registration.update();
      console.log('🔄 SW: Update check completed');
    } catch (error) {
      console.error('❌ SW: Update failed', error);
    }
  }

  async getRegistration(): Promise<ServiceWorkerRegistration | undefined> {
    if (typeof window === 'undefined') return undefined;
    return navigator.serviceWorker.getRegistration('/');
  }

  private async checkForUpdates(): Promise<void> {
    if (!document.hidden && this.registration) {
      console.log('🔍 SW: Checking for updates...');
      await this.update();
    }
  }

  private notifyUpdateAvailable(): void {
    // Dispatch custom event for update notification
    const event = new CustomEvent('sw-update-available', {
      detail: { registration: this.registration }
    });
    window.dispatchEvent(event);
  }

  // Force activate new service worker
  async activateUpdate(): Promise<void> {
    if (!this.registration?.waiting) return;

    // Send message to waiting SW to skip waiting
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // Show update notification instead of forced reload for PWA optimization
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🚀 SW: New version activated');
      
      // Dispatch event instead of forced reload to prevent PWA interruption
      const event = new CustomEvent('sw-controller-updated', {
        detail: { timestamp: Date.now() }
      });
      window.dispatchEvent(event);
    });
  }

  // Get SW version info
  async getVersion(): Promise<string> {
    if (!navigator.serviceWorker.controller) return 'No SW';
    
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        resolve(event.data.version || 'Unknown');
      };
      
      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_VERSION' },
        [channel.port2]
      );
    });
  }

  // Clear all SW caches
  async clearCaches(): Promise<void> {
    if (!navigator.serviceWorker.controller) return;
    
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
  }

  isUpdateAvailable(): boolean {
    return this.updateAvailable;
  }
}

// Singleton instance
export const swManager = new PWAServiceWorkerManager();

// Helper functions
export const registerServiceWorker = () => swManager.register();
export const updateServiceWorker = () => swManager.activateUpdate();
export const getServiceWorkerVersion = () => swManager.getVersion();
export const clearServiceWorkerCaches = () => swManager.clearCaches();