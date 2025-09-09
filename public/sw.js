/* SW: navigation-safe + prefetch-aware + warm cache
   Version bump if you change anything here:
*/
const SW_VERSION = 'v4';
const APP_SHELL_CACHE = `app-shell-${SW_VERSION}`;
const HTML_FALLBACK_URL = '/index.html';

// Разрешённые маршруты для навигации/прогрева (минимальный вайтлист).
// Регулярки применяются к pathname.
const ROUTE_WHITELIST = [
  /^\/$/,                    // главная
  /^\/seller(\/.*)?$/,       // seller dashboard
  /^\/admin(\/.*)?$/,        // admin
  /^\/buyer(\/.*)?$/,        // buyer
  /^\/product(\/.*)?$/,      // карточки товаров
];

// Флаг логов — временно включен для диагностики Cloudinary проблемы:
const DEBUG = true; // ВРЕМЕННО для исправления Cloudinary ошибок

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
    await self.clients.claim();
  })());
});

// Навигации: только настоящие переходы на документ (SPA), без prefetch
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Исключаем внешние CDN (особенно Cloudinary)
  if (isExternalCDN(request.url)) {
    if (DEBUG) console.log('[SW] SKIP external CDN:', request.url);
    return; // Пропускаем внешние CDN напрямую к сети
  }

  // Обрабатываем только same-origin запросы
  if (!isSameOrigin(request.url)) {
    if (DEBUG) console.log('[SW] SKIP non-same-origin:', request.url);
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
        if (DEBUG) console.log('[SW] Processing navigation:', request.url);
        // Пробуем сеть в первую очередь, чтобы не мешать <link rel="prefetch"> и SSR-заголовкам
        const network = await fetch(request);
        // Только успешные HTML кладём в кэш
        if (network && network.ok && (network.headers.get('content-type') || '').includes('text/html')) {
          const cache = await caches.open(APP_SHELL_CACHE);
          cache.put(HTML_FALLBACK_URL, network.clone());
          if (DEBUG) console.log('[SW] Cached HTML for:', request.url);
        }
        return network;
      } catch (e) {
        if (DEBUG) console.warn('[SW] network fail, fallback to cache', request.url, e);
        const cache = await caches.open(APP_SHELL_CACHE);
        const cached = await cache.match(HTML_FALLBACK_URL);
        if (cached) {
          if (DEBUG) console.log('[SW] Served from cache:', request.url);
          return cached;
        }
        // Last resort: голая офлайн-заглушка
        if (DEBUG) console.warn('[SW] Serving offline fallback for:', request.url);
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
      if (DEBUG) console.warn('[SW] WARM_ROUTE rejected (not whitelisted):', url);
      return;
    }
    if (DEBUG) console.log('[SW] WARM_ROUTE start:', url);
    event.waitUntil((async () => {
      try {
        // Тянем HTML документа (как обычную навигацию), но явно GET
        const resp = await fetch(url, { method: 'GET', credentials: 'same-origin' });
        if (resp.ok && (resp.headers.get('content-type') || '').includes('text/html')) {
          const cache = await caches.open(APP_SHELL_CACHE);
          await cache.put(HTML_FALLBACK_URL, resp.clone());
          if (DEBUG) console.log('[SW] WARM_ROUTE cached app shell from', url);
        } else if (DEBUG) {
          console.log('[SW] WARM_ROUTE non-HTML or not OK', resp.status, url);
        }
      } catch (e) {
        if (DEBUG) console.warn('[SW] WARM_ROUTE failed', url, e);
      }
    })());
  }

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});