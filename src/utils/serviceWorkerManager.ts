// Service Worker Manager - Minimal approach with NS_ERROR_CORRUPTED_CONTENT fix
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  // Disable SW in development to prevent main file blocking
  if (location.hostname.includes('sandbox.lovable.dev') || location.hostname.includes('localhost')) {
    console.log('[PWA] Service Worker disabled in development to prevent main file corruption');
    return;
  }

  console.log('[PWA] Service Worker registration enabled for production');

  // 🔧 CRITICAL: Clean up old/conflicting service worker registrations first
  await cleanupOldServiceWorkers();

  // 🚨 CRITICAL: Version 3.2.0-minimal-fixed to prevent NS_ERROR_CORRUPTED_CONTENT
  const versionTag = '3.2.0-minimal-fixed';
  const swUrl = `/sw-minimal.js?v=${encodeURIComponent(versionTag)}`;

  try {
    const reg = await navigator.serviceWorker.register(swUrl, { scope: '/' });

    // Проверяем, есть ли реально новая версия SW
    let hasNewVersion = false;
    
    reg.addEventListener('updatefound', () => {
      const sw = reg.installing;
      if (!sw) return;
      
      hasNewVersion = true;
      console.log('[PWA] New minimal service worker found, installing...');
      
      sw.addEventListener('statechange', () => {
        if (sw.state === 'installed' && reg.waiting) {
          console.log('[PWA] New service worker installed, activating...');
          reg.waiting.postMessage('SKIP_WAITING');
        }
      });
    });

    // Обновление вкладки только при реальной смене SW версии
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing || !hasNewVersion) return;
      refreshing = true;
      console.log('[PWA] Service Worker controller changed, reloading page...');
      window.location.reload();
    });

    console.log('[PWA] Service Worker registered:', swUrl);
  } catch (err) {
    console.warn('[PWA] Service Worker registration failed:', err);
  }
}

// 🧹 Clean up old/conflicting service worker registrations
async function cleanupOldServiceWorkers() {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const currentOrigin = location.origin + '/';
    
    for (const registration of registrations) {
      // 🚨 CRITICAL: Remove ALL /sw.js registrations to fix NS_ERROR_CORRUPTED_CONTENT
      if (registration.active?.scriptURL.includes('/sw.js')) {
        console.log('[PWA] 🚨 REMOVING CORRUPTED SW: /sw.js ->', registration.scope);
        await registration.unregister();
        continue;
      }
      
      // Keep only our current minimal SW, remove all others
      if (registration.scope !== currentOrigin || 
          !registration.active?.scriptURL.includes('sw-minimal.js')) {
        console.log('[PWA] Unregistering old/conflicting SW:', registration.scope);
        await registration.unregister();
      }
    }
    
    // 🚨 CRITICAL: Clear caches that cause NS_ERROR_CORRUPTED_CONTENT
    const cacheNames = await caches.keys();
    for (const cacheName of cacheNames) {
      if (cacheName.includes('app-shell-') || 
          cacheName.includes('runtime-') || 
          cacheName.includes('supabase') || 
          cacheName.includes('auth')) {
        console.log('[PWA] 🚨 CLEARING CORRUPTED CACHE:', cacheName);
        await caches.delete(cacheName);
      }
    }
  } catch (error) {
    console.warn('[PWA] Failed to cleanup old service workers:', error);
  }
}

// 🚨 CRITICAL: Special cleanup function for NS_ERROR_CORRUPTED_CONTENT fix
export async function cleanupCorruptedServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  
  try {
    console.log('[PWA] 🚨 CRITICAL CLEANUP: Removing corrupted service workers');
    
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    for (const registration of registrations) {
      // ONLY remove /sw.js registrations, keep sw-minimal.js
      if (registration.active?.scriptURL.includes('/sw.js') && 
          !registration.active?.scriptURL.includes('sw-minimal.js')) {
        console.log('[PWA] 🚨 FORCE REMOVING CORRUPTED SW:', registration.active.scriptURL);
        await registration.unregister();
      }
    }
    
    // Clear specific corrupted caches
    const cacheNames = await caches.keys();
    for (const cacheName of cacheNames) {
      if (cacheName.includes('app-shell-') || cacheName.includes('runtime-')) {
        console.log('[PWA] 🚨 FORCE CLEARING CORRUPTED CACHE:', cacheName);
        await caches.delete(cacheName);
      }
    }
    
    console.log('[PWA] ✅ Corrupted service worker cleanup completed');
  } catch (error) {
    console.error('[PWA] Failed to cleanup corrupted service worker:', error);
  }
}

// Legacy compatibility
export const swManager = {
  register: registerServiceWorker,
  getVersion: () => Promise.resolve('3.2.0-minimal-fixed'),
  getRegistration: () => navigator.serviceWorker?.getRegistration('/'),
};