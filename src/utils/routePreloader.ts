// src/utils/routePreloader.ts
// Универсальный прелоадер маршрутов, безопасный для SW.
// Сначала пытается "прогреть" через SW (postMessage: WARM_ROUTE),
// если SW не готов — использует <link rel="prefetch"> как fallback.

type PreloadOptions = {
  routes: string[];             // абсолютные или относительные (к текущему origin) пути
  disablePrefetchTag?: boolean; // можно быстро отключить <link rel=prefetch>
  debug?: boolean;
};

function toAbsolute(url: string): string {
  try {
    return new URL(url, window.location.origin).toString();
  } catch {
    return url;
  }
}

export async function preloadRoutes(opts: PreloadOptions) {
  const { routes, disablePrefetchTag = false, debug = false } = opts;

  if (!Array.isArray(routes) || routes.length === 0) return;

  // 1) Пробуем тёплый прогрев через активный SW
  let warmedBySW = false;
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg?.active) {
        for (const r of routes) {
          const url = toAbsolute(r);
          reg.active.postMessage({ type: 'WARM_ROUTE', url });
          if (debug) console.log('[Preloader] WARM_ROUTE ->', url);
        }
        warmedBySW = true;
      }
    }
  } catch (e) {
    if (debug) console.warn('[Preloader] SW warm failed', e);
  }

  // 2) Fallback: если SW не успел, аккуратно добавляем <link rel="prefetch">
  // ВАЖНО: это может конфликтовать, если SW перехватывает prefetch как навигации — мы это уже починили в SW.
  if (!warmedBySW && !disablePrefetchTag) {
    for (const r of routes) {
      try {
        const url = toAbsolute(r);
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        link.as = 'document'; // нам важен HTML
        link.crossOrigin = 'same-origin';
        (link as any).fetchPriority = 'low'; // браузер сам решит
        document.head.appendChild(link);
        if (debug) console.log('[Preloader] <link rel=prefetch> appended', url);
      } catch (e) {
        if (debug) console.warn('[Preloader] prefetch link failed', r, e);
      }
    }
  }
}