// src/utils/serviceWorkerManager.ts
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  // Отключить SW в development для предотвращения блокировки main файлов
  if (location.hostname.includes('sandbox.lovable.dev') || location.hostname.includes('localhost')) {
    console.log('[PWA] Service Worker disabled in development to prevent main file corruption');
    return;
  }

  console.log('[PWA] Service Worker registration enabled for production');

  // Статичный build ID - не используем Date.now() для избежания постоянных обновлений
  const versionTag = (window as any).__APP_BUILD_ID__ || 'v6-stable';
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

// Legacy compatibility - удалены неиспользуемые функции

export const swManager = {
  register: registerServiceWorker,
  getVersion: () => Promise.resolve('v6-stable'),
  getRegistration: () => navigator.serviceWorker?.getRegistration('/'),
};