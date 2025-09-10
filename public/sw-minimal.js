// Minimal Service Worker - offline fallback only
// Version: 2.1.0 - Simplified for stability

const CACHE_NAME = 'offline-fallback-v2';
const OFFLINE_HTML = '/index.html';

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