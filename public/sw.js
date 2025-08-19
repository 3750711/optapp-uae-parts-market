// PWA Service Worker - Optimized for minimal refresh behavior
const CACHE_NAME = 'partsbay-pwa-v1';
const STATIC_CACHE_NAME = 'partsbay-static-v1';

// Essential resources to cache
const ESSENTIAL_RESOURCES = ['/', '/offline.html'];

// Static assets to cache
const STATIC_RESOURCES = [
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/site.webmanifest'
];

// Прогрев критичных JS/CSS чанков из Vite modulepreload
async function warmAssetsCache() {
  try {
    const res = await fetch('/');
    const html = await res.text();
    const links = Array.from(html.matchAll(/<link[^>]+rel=["']modulepreload["'][^>]+href=["']([^"']+)["']/g))
      .map((m) => m[1]);

    console.log('🔥 SW: Warming assets cache:', links);
    const cache = await caches.open(STATIC_CACHE_NAME);
    await Promise.all(
      links.map(async (href) => {
        const url = new URL(href, self.location.origin).toString();
        try {
          const res = await fetch(url);
          if (res && res.ok) {
            await cache.put(url, res.clone());
          }
        } catch (error) {
          console.warn('⚠️ SW: Failed to warm asset:', url, error);
        }
      })
    );
  } catch (error) {
    console.warn('⚠️ SW: Asset warming failed:', error);
  }
}

// Install event - Cache essential resources and warm chunks
self.addEventListener('install', (event) => {
  console.log('🔧 SW: Installing...');
  event.waitUntil(
    (async () => {
      await Promise.all([
        caches.open(CACHE_NAME).then(cache => cache.addAll(ESSENTIAL_RESOURCES)),
        caches.open(STATIC_CACHE_NAME).then(cache => cache.addAll(STATIC_RESOURCES))
      ]);
      await warmAssetsCache();
      console.log('✅ SW: Installation complete with warmed assets');
      // Не вызываем skipWaiting — мягкое обновление
    })()
  );
});

// Activate event - Clean old caches and claim clients  
self.addEventListener('activate', (event) => {
  console.log('🚀 SW: Activating...');
  event.waitUntil(
    (async () => {
      // Enable Navigation Preload for faster page loads
      if ('navigationPreload' in self.registration) {
        await self.registration.navigationPreload.enable();
        console.log('⚡ SW: Navigation Preload enabled');
      }
      
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
            console.log('🗑️ SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
      
      console.log('✅ SW: Activated and claimed clients');
      return self.clients.claim();
    })()
  );
});

// Fetch event - Optimized strategies for true offline support
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle API requests - Network first with offline fallback
  if (url.pathname.startsWith('/api/') || url.hostname !== self.location.hostname) {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // Return offline response for failed API calls
          return new Response(JSON.stringify({ error: 'Offline' }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // Handle navigation requests - Stale-while-revalidate with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match('/');
        
        const networkPromise = fetch(request)
          .then(async (res) => {
            if (res && res.ok) {
              await cache.put('/', res.clone());
            }
            return res;
          })
          .catch(async () => {
            // Network failed - use cached or offline page
            return cached || (await cache.match('/offline.html'));
          });

        // Return cached immediately if available (PWA optimization)
        return cached || networkPromise;
      })()
    );
    return;
  }

  // Handle Vite assets (/assets/*.js|css|fonts|images) - Cache first for offline
  const isViteAsset = url.origin === self.location.origin &&
                      /^\/assets\/.+\.(?:js|css|woff2?|ttf|png|jpg|jpeg|svg|webp|ico|gif)$/.test(url.pathname);
  
  if (isViteAsset) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE_NAME);
        const cached = await cache.match(request);
        
        if (cached) {
          console.log('⚡ SW: Serving Vite asset from cache:', url.pathname);
          return cached;
        }
        
        try {
          const res = await fetch(request);
          if (res && res.ok) {
            await cache.put(request, res.clone());
            console.log('📦 SW: Cached Vite asset:', url.pathname);
          }
          return res;
        } catch {
          // Offline and not in cache - critical for chunk loading failures
          console.warn('❌ SW: Vite asset not available offline:', url.pathname);
          return new Response('', { status: 504, statusText: 'Offline - Asset Not Cached' });
        }
      })()
    );
    return;
  }

  // Handle other static assets - Cache first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request)
            .then(response => {
              // Cache successful responses
              if (response && response.ok) {
                const responseClone = response.clone();
                const cacheName = STATIC_RESOURCES.includes(url.pathname) ? 
                  STATIC_CACHE_NAME : CACHE_NAME;
                
                caches.open(cacheName).then(cache => {
                  cache.put(request, responseClone);
                });
              }
              return response;
            });
        })
    );
  }
});

// Message handling for PWA lifecycle
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
    case 'CLEAR_CACHE':
      caches.keys().then(cacheNames => {
        return Promise.all(cacheNames.map(name => caches.delete(name)));
      });
      break;
  }
});

// Background sync handling with client communication
self.addEventListener('sync', (event) => {
  console.log('🔄 SW: Background sync triggered', event.tag);
  
  if (event.tag.startsWith('sync-')) {
    event.waitUntil(handleBackgroundSync(event.tag));
  }
});

// Background sync handler
async function handleBackgroundSync(tag) {
  console.log('📱 SW: Processing background sync:', tag);
  
  try {
    // Notify the client to process sync queue
    const clients = await self.clients.matchAll();
    for (const client of clients) {
      client.postMessage({
        type: 'BACKGROUND_SYNC',
        tag: tag
      });
    }
  } catch (error) {
    console.error('❌ SW: Background sync failed:', error);
  }
}

// Handle push notifications (if needed in future)
self.addEventListener('push', (event) => {
  console.log('📱 SW: Push received');
});