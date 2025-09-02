// Service Worker configuration for Fix-Pack V3
// Ensures auth endpoints are never cached to prevent token refresh issues

// Never cache Supabase endpoints - EXPANDED for Safe Baseline
const NEVER_CACHE_PATTERNS = [
  /\/supabase\//,
  /\/auth\/v1\//,
  /\/rest\/v1\//,
  /\/storage\/v1\//,
  /\/functions\/v1\//,
  /\/realtime\/v1\//,
  /\/rpc\//
];

// Check if URL should never be cached
const shouldNeverCache = (url) => {
  return NEVER_CACHE_PATTERNS.some(pattern => pattern.test(url));
};

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker with auth-safe caching');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  event.waitUntil(self.clients.claim());
});

// Fetch event with auth-safe logic
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Never intercept auth-related requests - let them go directly to network
  if (shouldNeverCache(url.pathname)) {
    console.log('[SW] Bypassing cache for auth endpoint:', url.pathname);
    return; // Let the browser handle it normally
  }
  
  // For other requests, you can implement your caching strategy here
  // This is a minimal example - add your specific caching logic as needed
  
  // Example: Cache-first for static assets
  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request);
      })
    );
  }
});