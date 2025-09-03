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

  // Don't cache worker files - always fetch from network
  if (/\bworker\b.*\.js$/.test(url.pathname) || url.pathname.includes('smart-image-compress.worker')) {
    return; // Let it pass to network
  }

  // Skip caching for upload endpoints and external APIs
  const isUploadEndpoint = url.pathname.startsWith('/api/') || 
                          url.hostname.includes('cloudinary.com') ||
                          url.hostname.includes('api.partsbay.ae') ||
                          (url.hostname !== self.location.hostname && request.method === 'POST');
  
  // CRITICAL: Never cache ANY Supabase endpoints to prevent auth issues
  const isSupabaseEndpoint = url.pathname.includes('/auth/') ||
                            url.pathname.includes('/rest/') ||
                            url.pathname.includes('/storage/') ||
                            url.pathname.includes('/functions/') ||
                            url.pathname.includes('/realtime/') ||
                            url.hostname.includes('api.partsbay.ae');
  
  if (isUploadEndpoint || isSupabaseEndpoint) {
    // Never cache uploads, Supabase endpoints or external API calls - pass through directly
    return;
  }

  // Handle other external APIs - Network first with offline fallback
  if (url.hostname !== self.location.hostname) {
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

  // Handle navigation requests - Network-first with preload for version consistency
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // 1) Navigation Preload gives fast network response if available
          const preload = ('navigationPreload' in self.registration)
            ? await event.preloadResponse
            : null;
          if (preload) return preload;

          // 2) Network first to avoid HTML/chunk version mismatch
          const res = await fetch(request);
          if (res && res.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put('/', res.clone());
          }
          return res;
        } catch {
          // 3) Fallback to cache/offline page only when network fails
          const cache = await caches.open(CACHE_NAME);
          return (await cache.match('/')) || (await cache.match('/offline.html'));
        }
      })()
    );
    return;
  }

  // Handle JS assets - Network-first to prevent chunk version mismatch
  const isJS = url.origin === self.location.origin && /^\/assets\/.+\.js$/.test(url.pathname);
  if (isJS) {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(request); // Network first prevents chunk mismatch
          if (res && res.ok) {
            const cache = await caches.open(STATIC_CACHE_NAME);
            await cache.put(request, res.clone());
          }
          return res;
        } catch {
          // Fallback to cache only when network fails
          const cache = await caches.open(STATIC_CACHE_NAME);
          const cached = await cache.match(request);
          return cached || new Response('', { status: 504, statusText: 'Offline JS not cached' });
        }
      })()
    );
    return;
  }

  // Handle other Vite assets (CSS, fonts, images) - Cache first is safe
  const isViteAsset = url.origin === self.location.origin &&
                      /^\/assets\/.+\.(?:css|woff2?|ttf|png|jpg|jpeg|svg|webp|ico|gif)$/.test(url.pathname);
  
  if (isViteAsset) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE_NAME);
        const cached = await cache.match(request);
        
        if (cached) {
          return cached;
        }
        
        try {
          const res = await fetch(request);
          if (res && res.ok) {
            await cache.put(request, res.clone());
          }
          return res;
        } catch {
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