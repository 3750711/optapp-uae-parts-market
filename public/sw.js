/* SW: Simple and stable PWA system
   Version bump if you change anything here:
*/
const SW_VERSION = 'v6-stable';
const APP_SHELL_CACHE = `app-shell-${SW_VERSION}`;
const RUNTIME_CACHE = `runtime-${SW_VERSION}`;
const HTML_FALLBACK_URL = '/index.html';

// Cache limits for stability
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB limit
const MAX_CACHE_ENTRIES = 200;

// Разрешённые маршруты для навигации/прогрева (минимальный вайтлист).
// Регулярки применяются к pathname.
const ROUTE_WHITELIST = [
  /^\/$/,                    // главная
  /^\/seller(\/.*)?$/,       // seller dashboard
  /^\/admin(\/.*)?$/,        // admin
  /^\/buyer(\/.*)?$/,        // buyer
  /^\/product(\/.*)?$/,      // карточки товаров
];

// Флаг логов — только в development окружении:
const DEBUG = false; // В продакшене всегда false для производительности

// Утилиты
const isSameOrigin = (url) => {
  try {
    const u = new URL(url, self.location.origin);
    return u.origin === self.location.origin;
  } catch {
    return false;
  }
};

const isExternalCDN = (url) => {
  try {
    const u = new URL(url);
    const hostname = u.hostname.toLowerCase();
    // Проверяем известные внешние CDN
    const externalDomains = [
      'cloudinary.com',
      'res.cloudinary.com',
      'cdn.cloudinary.com',
      'images.cloudinary.com',
      'cdn.jsdelivr.net',
      'fonts.googleapis.com',
      'fonts.gstatic.com'
    ];
    return externalDomains.some(domain => hostname.includes(domain));
  } catch {
    return false;
  }
};

const isAuthRequest = (url) => {
  try {
    const u = new URL(url, self.location.origin);
    const pathname = u.pathname;
    const hostname = u.hostname;
    
    // 🚨 CRITICAL: Exclude all api.partsbay.ae requests (proxy domain)
    if (hostname.includes('api.partsbay.ae')) {
      return true;
    }
    
    // 🚨 CRITICAL: Exclude all Supabase API paths  
    if (pathname.startsWith('/rest/') || 
        pathname.startsWith('/auth/') || 
        pathname.startsWith('/functions/') ||
        pathname.startsWith('/v1/') ||
        pathname.includes('supabase') ||
        pathname.includes('session') ||
        pathname.includes('token') ||
        pathname.includes('refresh')) {
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
};

const isWhitelistedRoute = (url) => {
  try {
    const { pathname } = new URL(url, self.location.origin);
    return ROUTE_WHITELIST.some((re) => re.test(pathname));
  } catch {
    return false;
  }
};

const isPrefetchHeader = (req) => {
  // Браузеры могут слать разные заголовки для prefetch:
  // - Purpose: prefetch (Chrome старые)
  // - Sec-Purpose: prefetch (Chrome новые)
  // - Sec-Fetch-Mode: navigate|no-cors|cors|same-origin (для навигаций будет "navigate")
  const h = req.headers;
  const purpose = h.get('Purpose') || h.get('Sec-Purpose') || '';
  if (purpose.toLowerCase().includes('prefetch')) return true;

  // Если HTML не запрашивается как документ — тоже не наша «навигация».
  const dest = h.get('Sec-Fetch-Dest');
  if (dest && dest !== 'document') return true;

  // Если это явно <link rel="prefetch"> за статикой (script/style), то destination будет script/style/etc.
  // Мы их не обрабатываем в навигационном хэндлере.
  return false;
};

// Установка/активация
self.addEventListener('install', (event) => {
  if (DEBUG) console.log('[SW] install', SW_VERSION);
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  if (DEBUG) console.log('[SW] activate', SW_VERSION);
  event.waitUntil((async () => {
    // Сносим старые кэши других версий
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => !k.includes(SW_VERSION))
        .map((k) => caches.delete(k))
    );
    
    // Clean up oversized caches
    await cleanupCache();
    
    await self.clients.claim();
  })());
});

// Cache cleanup with LRU strategy for stability
async function cleanupCache() {
  try {
    const cache = await caches.open(RUNTIME_CACHE);
    const keys = await cache.keys();
    
    if (keys.length > MAX_CACHE_ENTRIES) {
      // Remove oldest 20% of entries
      const removeCount = Math.floor(keys.length * 0.2);
      const keysToRemove = keys.slice(0, removeCount);
      
      await Promise.all(keysToRemove.map(key => cache.delete(key)));
      if (DEBUG) console.log(`[SW] Cleaned up ${removeCount} cache entries`);
    }
  } catch (e) {
    if (DEBUG) console.warn('[SW] Cache cleanup failed:', e);
  }
}

// Background Sync event for simple offline capabilities
self.addEventListener('sync', (event) => {
  if (DEBUG) console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag.startsWith('sync-')) {
    event.waitUntil(handleBackgroundSync(event.tag));
  }
});

// Handle background sync - notify client to process queue
async function handleBackgroundSync(tag) {
  try {
    if (DEBUG) console.log('[SW] Processing background sync:', tag);
    
    // Notify client to process sync queue
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC',
        tag: tag
      });
    });
    
  } catch (error) {
    if (DEBUG) console.error('[SW] Background sync failed:', error);
  }
}

// Check if request has authentication headers
const hasAuthHeaders = (request) => {
  const auth = request.headers.get('authorization');
  const cookie = request.headers.get('cookie');
  const apiKey = request.headers.get('apikey');
  
  return !!(auth || apiKey || (cookie && (cookie.includes('sb-') || cookie.includes('supabase'))));
};

// Навигации: только настоящие переходы на документ (SPA), без prefetch
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 🚨 КРИТИЧЕСКАЯ БЕЗОПАСНОСТЬ: Исключаем внешние CDN (особенно Cloudinary)
  if (isExternalCDN(request.url)) {
    return; // Пропускаем внешние CDN напрямую к сети
  }

  // 🚨 КРИТИЧЕСКАЯ БЕЗОПАСНОСТЬ: Never cache requests with auth headers
  if (hasAuthHeaders(request)) {
    if (DEBUG) console.log('[SW] SKIP auth headers:', request.url);
    return; // Пропускаем все запросы с авторизацией напрямую
  }

  // Обрабатываем только same-origin запросы
  if (!isSameOrigin(request.url)) {
    return;
  }

  // 🚨 КРИТИЧЕСКАЯ БЕЗОПАСНОСТЬ: AUTH запросы НЕ должны перехватываться SW
  if (isAuthRequest(request.url)) {
    if (DEBUG) console.log('[SW] SKIP AUTH request:', request.url, request.method);
    return; // Пропускаем все AUTH запросы напрямую к серверу
  }

  // 🚨 КРИТИЧЕСКАЯ БЕЗОПАСНОСТЬ: Исключаем main entry файл от SW обработки
  if (request.url.includes('/assets/main-')) {
    if (DEBUG) console.log('[SW] SKIP main entry file to prevent corruption:', request.url);
    return; // Пропускаем main файл для предотвращения NS_ERROR_CORRUPTED_CONTENT
  }

  // ⚡ КЕШИРОВАНИЕ СТАТИКИ: Cache First для JS/CSS
  const dest = request.destination;
  if (dest === 'script' || dest === 'style') {
    event.respondWith((async () => {
      const cache = await caches.open(APP_SHELL_CACHE);
      const cached = await cache.match(request);
      if (cached) {
        if (DEBUG) console.log('[SW] Cache hit (static):', request.url);
        return cached;
      }
      
      try {
        const response = await fetch(request);
        if (response.ok) {
          cache.put(request, response.clone());
          if (DEBUG) console.log('[SW] Cached static:', request.url);
        }
        return response;
      } catch (e) {
        if (DEBUG) console.warn('[SW] Static fetch failed:', request.url, e);
        throw e;
      }
    })());
    return;
  }

  // Нас интересуют HTML-страницы: mode=navigate ИЛИ accept: text/html,
  // но исключаем prefetch заголовки и недокументные назначения.
  const isNavigateMode = request.mode === 'navigate';
  const accept = request.headers.get('accept') || '';
  const looksLikeHTML = accept.includes('text/html');

  // Важное исключение: prefetch не трогаем, иначе ловим NS_BINDING_ABORTED при конкуренции с <link rel="prefetch">
  if (isPrefetchHeader(request)) {
    if (DEBUG) console.log('[SW] skip prefetch', request.url);
    return; // пропускаем до сети/браузера
  }

  if (isNavigateMode || looksLikeHTML) {
    // Работает только для whitelisted роутов SPA
    if (!isWhitelistedRoute(request.url)) {
      if (DEBUG) console.log('[SW] nav not whitelisted, passthrough', request.url);
      return; // пускаем напрямую
    }

    // App-Shell стратегия: Stale-While-Revalidate для HTML (index.html)
    event.respondWith((async () => {
      try {
        // Пробуем сеть в первую очередь
        const network = await fetch(request);
        // Только успешные HTML кладём в кэш
        if (network && network.ok && (network.headers.get('content-type') || '').includes('text/html')) {
          const cache = await caches.open(APP_SHELL_CACHE);
          cache.put(HTML_FALLBACK_URL, network.clone());
        }
        return network;
      } catch (e) {
        // Offline fallback: возвращаем кешированный index.html
        const cache = await caches.open(APP_SHELL_CACHE);
        const cached = await cache.match(HTML_FALLBACK_URL);
        if (cached) {
          return cached;
        }
        // Last resort: минимальная офлайн-заглушка
        return new Response('<!doctype html><title>Offline</title><h1>Offline</h1>', {
          headers: { 'content-type': 'text/html' },
          status: 200,
        });
      }
    })());
  }
});

// Прогрев маршрутов из приложения (без запуска <link rel=prefetch>)
// Жёстко ограничиваем домен и вайтлист, чтобы не превратить в CDN-прокачку
self.addEventListener('message', (event) => {
  const { data } = event;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'WARM_ROUTE' && typeof data.url === 'string') {
    const url = new URL(data.url, self.location.origin).toString();
    if (!isSameOrigin(url) || !isWhitelistedRoute(url)) {
      return;
    }
    event.waitUntil((async () => {
      try {
        const resp = await fetch(url, { method: 'GET', credentials: 'same-origin' });
        if (resp.ok && (resp.headers.get('content-type') || '').includes('text/html')) {
          const cache = await caches.open(APP_SHELL_CACHE);
          await cache.put(HTML_FALLBACK_URL, resp.clone());
        }
      } catch (e) {
        // Тихо игнорируем ошибки прогрева
      }
    })());
  }

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});