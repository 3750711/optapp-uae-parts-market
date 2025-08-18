// PWA Service Worker - Optimized for minimal refresh behavior
const CACHE_NAME = 'partsbay-pwa-v1';
const STATIC_CACHE_NAME = 'partsbay-static-v1';

// Essential resources to cache
const ESSENTIAL_RESOURCES = [
  '/',
  '/catalog',
  '/admin/free-order',
  '/admin/add-product',
  '/offline.html'
];

// Static assets to cache
const STATIC_RESOURCES = [
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/site.webmanifest'
];

// Install event - Cache essential resources
self.addEventListener('install', (event) => {
  console.log('🔧 SW: Installing...');
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => cache.addAll(ESSENTIAL_RESOURCES)),
      caches.open(STATIC_CACHE_NAME).then(cache => cache.addAll(STATIC_RESOURCES))
    ]).then(() => {
      console.log('✅ SW: Installation complete');
      // Skip waiting to activate immediately
      return self.skipWaiting();
    })
  );
});

// Activate event - Clean old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('🚀 SW: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
            console.log('🗑️ SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ SW: Activated and claimed clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - Network first with cache fallback strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle API requests - Network first
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

  // Handle navigation requests - Network first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful navigation responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Try cache first, then offline page
          return caches.match(request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Return offline page
              return caches.match('/offline.html');
            });
        })
    );
    return;
  }

  // Handle static assets - Cache first
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(request)
          .then(response => {
            // Cache successful responses
            if (response.ok) {
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

// Prevent SW from being killed during background sync
self.addEventListener('sync', (event) => {
  console.log('🔄 SW: Background sync triggered');
});

// Handle push notifications (if needed in future)
self.addEventListener('push', (event) => {
  console.log('📱 SW: Push received');
});