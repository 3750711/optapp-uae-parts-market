// Development-friendly Service Worker for Lovable editing
// Minimal caching to allow real-time file updates

// Never cache these patterns to ensure live editing works
const NEVER_CACHE_PATTERNS = [
  /\/supabase\//,
  /\/auth\/v1\//,
  /\/rest\/v1\//,
  /\/storage\/v1\//,
  /\/functions\/v1\//,
  /\/realtime\/v1\//,
  /\/rpc\//,
  // Development patterns - allow Lovable updates
  /\/__vite__/,
  /\/src\//,
  /\.tsx?$/,
  /\.css$/,
  /\.js$/
];

// Check if URL should never be cached
const shouldNeverCache = (url) => {
  return NEVER_CACHE_PATTERNS.some(pattern => pattern.test(url));
};

// Install event - force immediate activation for development
self.addEventListener('install', (event) => {
  console.log('[SW] Installing development-friendly service worker');
  // Skip waiting to activate immediately (important for Lovable updates)
  self.skipWaiting();
});

// Activate event - take control immediately
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating development service worker');
  event.waitUntil(
    Promise.all([
      // Clear old caches to prevent stale content
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log('[SW] Clearing cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});

// Fetch event - minimal caching for development
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Never cache development files or auth endpoints
  if (shouldNeverCache(url.pathname) || shouldNeverCache(request.url)) {
    console.log('[SW] Bypassing cache for:', url.pathname);
    return; // Let browser handle normally for live updates
  }
  
  // Only cache static assets, always fetch fresh for development
  if (request.destination === 'image' || request.destination === 'font') {
    event.respondWith(
      caches.open('static-v3-back-to-supabase').then(cache => {
        return cache.match(request).then(response => {
          if (response) {
            // Check if cached version is recent (< 1 hour for development)
            const cacheDate = response.headers.get('sw-cache-date');
            if (cacheDate && (Date.now() - parseInt(cacheDate)) < 3600000) {
              return response;
            }
          }
          // Fetch fresh and cache with timestamp
          return fetch(request).then(fetchResponse => {
            if (fetchResponse.ok) {
              const responseClone = fetchResponse.clone();
              const headers = new Headers(responseClone.headers);
              headers.set('sw-cache-date', Date.now().toString());
              cache.put(request, new Response(responseClone.body, {
                status: responseClone.status,
                statusText: responseClone.statusText,
                headers: headers
              }));
            }
            return fetchResponse;
          });
        });
      })
    );
  }
});

// Handle messages for manual cache control
self.addEventListener('message', (event) => {
  const { type } = event.data || {};
  
  if (type === 'SKIP_WAITING') {
    console.log('[SW] Force activating new version');
    self.skipWaiting();
  } else if (type === 'CLEAR_CACHE') {
    console.log('[SW] Clearing all caches');
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(cacheNames.map(name => caches.delete(name)));
      }).then(() => {
        event.ports[0]?.postMessage({ success: true });
      })
    );
  }
});