// src/utils/serviceWorkerManager.ts
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  // Статичный build ID - не используем Date.now() для избежания постоянных обновлений
  const versionTag = (window as any).__APP_BUILD_ID__ || 'v2025-09-09-1';
  const swUrl = `/sw.js?v=${encodeURIComponent(versionTag)}`;

  try {
    const reg = await navigator.serviceWorker.register(swUrl, { scope: '/' });

    // Проверяем, есть ли реально новая версия SW
    let hasNewVersion = false;
    
    reg.addEventListener('updatefound', () => {
      const sw = reg.installing;
      if (!sw) return;
      
      hasNewVersion = true;
      console.log('[PWA] New service worker found, installing...');
      
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

// Legacy compatibility stubs for disabled components
export const updateServiceWorker = () => {
  console.warn('[PWA] Legacy updateServiceWorker called - functionality simplified');
  window.location.reload();
};

export const clearServiceWorkerCaches = () => {
  console.warn('[PWA] Legacy clearServiceWorkerCaches called - not implemented in simplified version');
};

export const swManager = {
  register: registerServiceWorker,
  isUpdateAvailable: () => false,
  getVersion: () => Promise.resolve('v2025-09-09-1'),
  getRegistration: () => navigator.serviceWorker?.getRegistration('/'),
};