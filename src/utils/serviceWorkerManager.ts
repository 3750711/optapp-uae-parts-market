// Service Worker Manager - Enhanced anti-reload loop protection
let isRegistering = false;
let currentControllerURL = navigator.serviceWorker?.controller?.scriptURL;

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  
  // Prevent multiple simultaneous registrations
  if (isRegistering) {
    console.log('[PWA] Registration already in progress, skipping...');
    return;
  }

  // Disable SW in development to prevent main file blocking
  if (location.hostname.includes('sandbox.lovable.dev') || location.hostname.includes('localhost')) {
    console.log('[PWA] Service Worker disabled in development to prevent main file corruption');
    return;
  }

  console.log('[PWA] Service Worker registration enabled for production');
  isRegistering = true;

  try {
    // 🔧 CRITICAL: Clean up old/conflicting service worker registrations first
    await cleanupOldServiceWorkers();

    // 🚨 CRITICAL: Version 3.7.0-sw-unified - Single SW architecture
    const versionTag = '3.7.0-sw-unified';
    const swUrl = `/sw-minimal.js?v=${encodeURIComponent(versionTag)}`;

    // Check if we already have this exact SW registered
    const existingReg = await navigator.serviceWorker.getRegistration('/');
    if (existingReg?.active?.scriptURL === new URL(swUrl, location.origin).href) {
      console.log('[PWA] ✅ Required Service Worker already active, skipping registration');
      return;
    }

    const reg = await navigator.serviceWorker.register(swUrl, { scope: '/' });

    // Track if this is a genuine new version installation
    let hasNewVersion = false;
    let isFirstInstallation = !navigator.serviceWorker.controller;
    
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

    // Smart reload logic - only reload when necessary
    let refreshing = false;
    const controllerChangeHandler = () => {
      const newControllerURL = navigator.serviceWorker.controller?.scriptURL;
      
      // Don't reload if:
      // - Already refreshing
      // - No new version detected
      // - First installation (no previous controller)
      // - Controller URL hasn't actually changed
      if (refreshing || !hasNewVersion || isFirstInstallation || newControllerURL === currentControllerURL) {
        console.log('[PWA] Skipping reload - not a genuine SW update');
        return;
      }
      
      refreshing = true;
      currentControllerURL = newControllerURL;
      console.log('[PWA] Service Worker controller genuinely changed, reloading page...');
      
      // Small delay to ensure SW is fully active
      setTimeout(() => {
        window.location.reload();
      }, 100);
    };

    navigator.serviceWorker.addEventListener('controllerchange', controllerChangeHandler);

    console.log('[PWA] Service Worker registered:', swUrl);
  } catch (err) {
    console.warn('[PWA] Service Worker registration failed:', err);
  } finally {
    isRegistering = false;
  }
}

// 🧹 AGGRESSIVE cleanup - removes ALL conflicting service workers and caches
async function cleanupOldServiceWorkers() {
  if (!('serviceWorker' in navigator)) return;
  
  try {
    console.log('[PWA] 🧹 Starting aggressive SW cleanup...');
    
    const registrations = await navigator.serviceWorker.getRegistrations();
    const currentOrigin = location.origin + '/';
    
    // STEP 1: Unregister ALL conflicting Service Workers
    for (const registration of registrations) {
      const scriptURL = registration.active?.scriptURL || 
                        registration.waiting?.scriptURL || 
                        registration.installing?.scriptURL || '';
      
      // Remove old/conflicting SWs
      const shouldRemove = 
        scriptURL.includes('/sw.js') || 
        scriptURL.includes('/sw-cache.js') ||
        scriptURL.includes('sw-v6-stable') ||
        scriptURL.includes('app-shell-') ||
        (!scriptURL.includes('sw-minimal.js') && scriptURL.includes('.js'));
      
      if (shouldRemove) {
        console.log('[PWA] 🗑️ REMOVING CONFLICTING SW:', scriptURL);
        await registration.unregister();
        continue;
      }
      
      // Keep only current sw-minimal.js on correct scope
      if (registration.scope !== currentOrigin || 
          !scriptURL.includes('sw-minimal.js')) {
        console.log('[PWA] 🗑️ Removing outdated SW:', scriptURL);
        await registration.unregister();
      }
    }
    
    // STEP 2: Delete ALL old caches
    const cacheNames = await caches.keys();
    const currentCache = 'offline-fallback-v3-7-0-unified';
    
    for (const cacheName of cacheNames) {
      // Remove caches from old SWs
      const isOldCache = 
        cacheName.includes('app-shell-') || 
        cacheName.includes('runtime-') ||
        cacheName.includes('cloudinary-images-') ||
        cacheName.includes('supabase') ||
        cacheName.includes('auth') ||
        (cacheName.includes('offline-fallback-') && cacheName !== currentCache);
      
      if (isOldCache) {
        console.log('[PWA] 🗑️ DELETING OLD CACHE:', cacheName);
        await caches.delete(cacheName);
      }
    }
    
    console.log('[PWA] ✅ Aggressive cleanup completed');
  } catch (error) {
    console.error('[PWA] ❌ Cleanup failed:', error);
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
  getVersion: () => Promise.resolve('3.7.0-sw-unified'),
  getRegistration: () => navigator.serviceWorker?.getRegistration('/'),
};