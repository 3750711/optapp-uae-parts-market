// Minimal Service Worker - offline fallback only  
// Version: 3.1.0 - Enhanced for PWA session stability

const CACHE_NAME = 'offline-fallback-v3';
const OFFLINE_HTML = '/index.html';

// 🚨 Never cache requests with auth data
const hasAuthData = (request) => {
  const url = request.url;
  const auth = request.headers.get('authorization');
  const cookie = request.headers.get('cookie');
  
  // Check for api.partsbay.ae domain (our Supabase proxy)
  if (url.includes('api.partsbay.ae')) return true;
  
  // Check for auth headers or supabase cookies
  return auth || (cookie && cookie.includes('sb-'));
};

// Minimal install - just cache the offline fallback
self.addEventListener('install', (event) => {
  console.log('📦 SW: Installing minimal service worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.add(OFFLINE_HTML);
    }).then(() => {
      self.skipWaiting();
    })
  );
});

// Clean activation
self.addEventListener('activate', (event) => {
  console.log('✅ SW: Activating minimal service worker');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Minimal fetch - only handle navigation requests for offline fallback
self.addEventListener('fetch', (event) => {
  // 🚨 CRITICAL: Never intercept auth-related requests
  if (hasAuthData(event.request)) {
    return; // Let auth requests pass through directly
  }
  
  // Only handle navigation requests (HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_HTML);
      })
    );
  }
  // Let all other requests (JS, CSS, API, images) go through normally
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});