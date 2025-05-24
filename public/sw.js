
const CACHE_NAME = 'partsbay-images-v1';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

// Install service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Intercept fetch requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only cache images from Supabase storage or specific image domains
  if (
    request.method === 'GET' && 
    (url.hostname.includes('supabase') || 
     url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i))
  ) {
    event.respondWith(handleImageRequest(request));
  }
});

async function handleImageRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Check if image is in cache
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Check if cached image is still valid
      const cachedDate = cachedResponse.headers.get('sw-cached-date');
      if (cachedDate) {
        const cacheAge = Date.now() - parseInt(cachedDate);
        if (cacheAge < CACHE_EXPIRY) {
          console.log('Serving from cache:', request.url);
          return cachedResponse;
        }
      }
    }

    // Fetch fresh image
    console.log('Fetching fresh image:', request.url);
    const response = await fetch(request);
    
    if (response.ok) {
      // Clone response and add cache timestamp
      const responseToCache = response.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-date', Date.now().toString());
      
      const cachedResponse = new Response(await responseToCache.blob(), {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      // Cache the image
      await cache.put(request, cachedResponse);
    }
    
    return response;
  } catch (error) {
    console.error('Error handling image request:', error);
    
    // Try to serve from cache as fallback
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return a placeholder image as last resort
    return new Response('', { status: 404 });
  }
}

// Clean up expired cache entries periodically
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAN_CACHE') {
    cleanExpiredCache();
  }
});

async function cleanExpiredCache() {
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();
  
  for (const request of requests) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      const cachedDate = cachedResponse.headers.get('sw-cached-date');
      if (cachedDate) {
        const cacheAge = Date.now() - parseInt(cachedDate);
        if (cacheAge >= CACHE_EXPIRY) {
          console.log('Deleting expired cache entry:', request.url);
          await cache.delete(request);
        }
      }
    }
  }
}
