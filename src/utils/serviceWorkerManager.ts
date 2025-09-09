// src/utils/serviceWorkerManager.ts
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  // Простой cache-busting за счёт билд-тэга
  const versionTag = (window as any).__APP_BUILD_ID__ || Date.now().toString();
  const swUrl = `/sw.js?v=${encodeURIComponent(versionTag)}`;

  try {
    const reg = await navigator.serviceWorker.register(swUrl, { scope: '/' });

    // мгновенная активация новой версии
    if (reg.waiting) reg.waiting.postMessage('SKIP_WAITING');
    reg.addEventListener('updatefound', () => {
      const sw = reg.installing;
      if (!sw) return;
      sw.addEventListener('statechange', () => {
        if (sw.state === 'installed' && reg.waiting) {
          reg.waiting.postMessage('SKIP_WAITING');
        }
      });
    });

    // мягкое обновление вкладки при смене контроллера
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
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