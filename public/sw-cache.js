// Service Worker for Cloudinary Image Caching
const CACHE_NAME = 'cloudinary-images-v1';
const CLOUDINARY_DOMAIN = 'res.cloudinary.com';
const MAX_CACHE_SIZE = 100; // Maximum number of cached images
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing cache service worker');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating cache service worker');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - intercept image requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only handle Cloudinary images
  if (url.hostname.includes(CLOUDINARY_DOMAIN) && event.request.method === 'GET') {
    event.respondWith(handleImageRequest(event.request));
  }
});

async function handleImageRequest(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // Check if cached response is still valid
    if (cachedResponse) {
      const cachedDate = cachedResponse.headers.get('sw-cached-date');
      if (cachedDate && Date.now() - parseInt(cachedDate) < CACHE_EXPIRY) {
        console.log('Service Worker: Returning cached image', request.url);
        return cachedResponse;
      } else {
        // Cache expired, delete it
        await cache.delete(request);
      }
    }
    
    // Fetch from network
    console.log('Service Worker: Fetching image from network', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone response and add cache timestamp
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cached-date', Date.now().toString());
      
      const cacheResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers
      });
      
      // Manage cache size
      await manageCacheSize(cache);
      
      // Cache the response
      await cache.put(request, cacheResponse);
      console.log('Service Worker: Cached image', request.url);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Error handling image request', error);
    // Return cached version if available, even if expired
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

async function manageCacheSize(cache) {
  const keys = await cache.keys();
  if (keys.length >= MAX_CACHE_SIZE) {
    // Remove oldest entries (FIFO)
    const entriesToRemove = keys.slice(0, keys.length - MAX_CACHE_SIZE + 10);
    await Promise.all(entriesToRemove.map(key => cache.delete(key)));
    console.log(`Service Worker: Removed ${entriesToRemove.length} old cache entries`);
  }
}