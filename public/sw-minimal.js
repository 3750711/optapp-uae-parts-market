// Minimal Service Worker - Enhanced privacy protection for api.partsbay.ae
// Version: 3.3.0 - Strict private request skipping

const CACHE_NAME = 'offline-fallback-v3-4-0';
const OFFLINE_HTML = '/index.html';

// 🚨 CRITICAL: Enhanced private request detection - never intercept these
const SKIP = (url) => {
  const u = new URL(url);
  
  // Never intercept our Supabase proxy domain entirely
  if (u.hostname.endsWith('api.partsbay.ae')) return true;
  
  // Never intercept any Supabase domains
  if (u.hostname.includes('supabase.co') || u.hostname.includes('supabase.com')) return true;
  
  // Never intercept auth/API/functions/storage/realtime paths
  if (u.pathname.startsWith('/auth') ||
      u.pathname.startsWith('/rest') ||
      u.pathname.startsWith('/rpc') ||
      u.pathname.startsWith('/functions') ||
      u.pathname.startsWith('/storage') ||
      u.pathname.startsWith('/realtime')) return true;
  
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

// 🚨 CRITICAL: Minimal fetch - strict private request skipping
self.addEventListener('fetch', (event) => {
  // Skip ALL private requests - let them go to network directly
  if (SKIP(event.request.url)) {
    return; // Pass through to network without interception
  }
  
  // Skip static assets to prevent corruption
  if (isStaticAsset(event.request)) {
    console.log('🚨 SW: Skipping static asset to prevent corruption:', event.request.url);
    return;
  }
  
  // Only handle navigation requests for offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        console.log('📱 SW: Serving offline fallback for:', event.request.url);
        return caches.match(OFFLINE_HTML);
      })
    );
  }
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});