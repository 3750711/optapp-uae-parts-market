/* Minimal, stable Service Worker for PartsBay via proxy
   - Network-only: any API (proxy, Supabase) + any OPTIONS
   - HTML (navigations): Network-first with fallback to cached shell if доступен
   - JS/CSS: Stale-While-Revalidate (same-origin only)
   - Images/Fonts: Cache-First (same-origin only), size <= 2MB
   - Exclude Cloudinary/Telegram/CDN/3rd-party from caching
   - Safe cache versioning + cleanup
*/

const SW_VERSION = 'v2025-09-09-1';
const STATIC_CACHE = `pb-static-${SW_VERSION}`;
const RUNTIME_CACHE = `pb-runtime-${SW_VERSION}`;
const IMAGE_CACHE = `pb-images-${SW_VERSION}`;

const PROXY_HOST = 'api.partsbay.ae';
const SUPABASE_SUFFIX = '.supabase.co';
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_RUNTIME_ENTRIES = 80;
const MAX_IMAGE_ENTRIES = 80;

// Минимальный пре-кэш только для shell; offline.html не используем
const PRECACHE_URLS = ['/', '/site.webmanifest', '/android-chrome-192x192.png', '/android-chrome-512x512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    if ('navigationPreload' in self.registration) {
      try { await self.registration.navigationPreload.enable(); } catch {}
    }
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => ![STATIC_CACHE, RUNTIME_CACHE, IMAGE_CACHE].includes(k))
        .map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isApiRequest(url) {
  const u = new URL(url);
  const host = u.hostname;
  if (host === PROXY_HOST) return true;         // наш прокси
  if (host.endsWith(SUPABASE_SUFFIX)) return true; // прямые supabase-хосты
  return false;
}

function isThirdParty(url) {
  const u = new URL(url);
  const h = u.hostname;
  if (h.endsWith('cloudinary.com')) return true;
  if (h === 't.me' || h.endsWith('.t.me')) return true;
  if (h.endsWith('gstatic.com')) return true;
  if (h.endsWith('googleapis.com')) return true;
  if (h.endsWith('fbcdn.net') || h.endsWith('facebook.com')) return true;
  if (h.endsWith('twitter.com') || h.endsWith('x.com')) return true;
  if (h === 'cdn.jsdelivr.net' || h.endsWith('unpkg.com')) return true;
  return false;
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  for (let i = 0; i < keys.length - maxEntries; i++) {
    await cache.delete(keys[i]);
  }
}

async function cachePutIfSmall(cacheName, request, response) {
  try {
    if (response.type === 'opaque') return response; // не знаем размер — не кладём
    const len = Number(response.headers.get('content-length') || '0');
    if (len && len > MAX_IMAGE_BYTES) return response; // слишком большой
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
    return response;
  } catch {
    return response;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  // Никогда не кэшируем preflight — иначе сломается CORS
  if (request.method === 'OPTIONS') {
    event.respondWith(fetch(request));
    return;
  }

  // Любые API (proxy/Supabase) и запросы с no-store — только сеть
  if (isApiRequest(url) || request.headers.get('cache-control')?.includes('no-store')) {
    event.respondWith(fetch(request));
    return;
  }

  // Навигации: Network-first с лёгким fallback на кэшированный shell
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        console.log('[SW] Handling navigation:', url);
        
        const preload = 'navigationPreload' in self.registration
          ? await self.registration.navigationPreload.getState().then(s => s.enabled ? event.preloadResponse : null).catch(() => null)
          : null;
        
        const res = preload ? await preload : await fetch(request);
        
        // Проверяем, что ответ успешный
        if (!res.ok) {
          console.warn('[SW] Navigation failed with status:', res.status);
          throw new Error(`Navigation failed: ${res.status}`);
        }
        
        const cache = await caches.open(RUNTIME_CACHE);
        // кэшируем корневой shell для быстрого возврата
        if (new URL(url).pathname === '/') {
          cache.put('/', res.clone()).catch(e => console.warn('[SW] Cache put failed:', e));
        }
        trimCache(RUNTIME_CACHE, MAX_RUNTIME_ENTRIES);
        
        console.log('[SW] Navigation successful:', url);
        return res;
      } catch (error) {
        console.error('[SW] Navigation error for:', url, error);
        
        // простой graceful degradation: вернём кэшированный shell, если он есть
        const cache = await caches.open(STATIC_CACHE);
        const cachedResponse = await cache.match('/');
        
        if (cachedResponse) {
          console.log('[SW] Returning cached shell for failed navigation');
          return cachedResponse;
        }
        
        // Если нет кэшированного shell, пробрасываем ошибку чтобы браузер обработал как обычно
        throw error;
      }
    })());
    return;
  }

  const dest = request.destination;

  // JS/CSS: улучшенная stale-while-revalidate с правильной обработкой динамических импортов
  if ((dest === 'script' || dest === 'style') && new URL(url).origin === self.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const cachedResponse = await cache.match(request);
      
      try {
        // Всегда пытаемся получить свежую версию для динамических импортов
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
          // Кэшируем только успешные ответы
          cache.put(request, networkResponse.clone()).catch(e => 
            console.warn('[SW] Cache put failed for script:', e)
          );
          trimCache(RUNTIME_CACHE, MAX_RUNTIME_ENTRIES);
        }
        
        return networkResponse;
      } catch (error) {
        console.warn('[SW] Network failed for script:', url, error);
        
        // Возвращаем кэшированную версию только если она есть
        if (cachedResponse) {
          console.log('[SW] Using cached version for:', url);
          return cachedResponse;
        }
        
        // Если нет кэша, пробрасываем ошибку для корректной обработки браузером
        throw error;
      }
    })());
    return;
  }

  // Изображения/шрифты: Cache-First с ограничением размера (same-origin)
  if ((dest === 'image' || dest === 'font') && new URL(url).origin === self.origin && !isThirdParty(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(IMAGE_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const res = await fetch(request);
        const stored = await cachePutIfSmall(IMAGE_CACHE, request, res.clone());
        trimCache(IMAGE_CACHE, MAX_IMAGE_ENTRIES);
        return stored;
      } catch {
        // без особых фолбеков; просто пробрасываем ошибку
        throw new Error('Image fetch failed');
      }
    })());
    return;
  }

  // Всё остальное — напрямую в сеть без кэширования
  event.respondWith(fetch(request));
});