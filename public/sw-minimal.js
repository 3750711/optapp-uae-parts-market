// Minimal Service Worker - offline fallback only with NS_ERROR_CORRUPTED_CONTENT fix
// Version: 3.2.0 - Enhanced auth protection and JavaScript file safety

const CACHE_NAME = 'offline-fallback-v3-2';
const OFFLINE_HTML = '/index.html';

// 🚨 CRITICAL: Enhanced auth request detection to prevent corruption
const isAuthRequest = (request) => {
  const url = request.url;
  
  // Never intercept api.partsbay.ae (our Supabase proxy)
  if (url.includes('api.partsbay.ae')) return true;
  
  // Never intercept any Supabase-related requests
  if (url.includes('supabase.co') || url.includes('supabase.com')) return true;
  
  // Never intercept auth endpoints
  if (url.includes('/auth/') || url.includes('/login') || url.includes('/logout')) return true;
  
  return false;
};

// 🚨 CRITICAL: Check for auth headers that indicate secure requests
const hasAuthHeaders = (request) => {
  const auth = request.headers.get('authorization');
  const apikey = request.headers.get('apikey');
  const cookie = request.headers.get('cookie');
  
  // Check for any auth-related headers
  if (auth || apikey) return true;
  
  // Check for supabase cookies
  if (cookie && (cookie.includes('sb-') || cookie.includes('auth'))) return true;
  
  return false;
};

// 🚨 CRITICAL: Never cache requests with auth data - enhanced version
const hasAuthData = (request) => {
  return isAuthRequest(request) || hasAuthHeaders(request);
};

// 🚨 CRITICAL: Never cache JavaScript/CSS files to prevent NS_ERROR_CORRUPTED_CONTENT
const isStaticAsset = (request) => {
  const url = request.url;
  
  // NEVER cache JavaScript files
  if (url.includes('.js') || url.includes('.jsx') || url.includes('.ts') || url.includes('.tsx')) {
    return true;
  }
  
  // NEVER cache CSS files
  if (url.includes('.css')) {
    return true;
  }
  
  // NEVER cache main bundle files
  if (url.includes('/assets/') && (url.includes('main') || url.includes('index'))) {
    return true;
  }
  
  return false;
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

// 🚨 CRITICAL: Minimal fetch - with NS_ERROR_CORRUPTED_CONTENT protection
self.addEventListener('fetch', (event) => {
  // 🚨 CRITICAL: Never intercept auth-related requests
  if (hasAuthData(event.request)) {
    console.log('🚨 SW: Skipping auth/api request:', event.request.url);
    return; // Let auth requests pass through directly
  }
  
  // 🚨 CRITICAL: Never intercept JavaScript/CSS files to prevent corruption
  if (isStaticAsset(event.request)) {
    console.log('🚨 SW: Skipping static asset to prevent corruption:', event.request.url);
    return; // Let static assets load normally
  }
  
  // Only handle navigation requests (HTML pages) for offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        console.log('📱 SW: Serving offline fallback for:', event.request.url);
        return caches.match(OFFLINE_HTML);
      })
    );
  }
  // Let all other requests go through normally - no caching to prevent corruption
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});