// Minimal Service Worker - Enhanced privacy + route warming
// Version: 3.7.1-cloudinary-fix - Prefetch protection, WARM_ROUTE support, Cloudinary widget fix

const CACHE_NAME = 'offline-fallback-v3-7-1-cloudinary';
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

// 🚨 CRITICAL: Detect prefetch requests to prevent NS_BINDING_ABORTED
const isPrefetchRequest = (request) => {
  // Check Purpose headers (standard way)
  const purpose = request.headers.get('Purpose') || 
                  request.headers.get('Sec-Purpose') || '';
  if (purpose.toLowerCase().includes('prefetch')) {
    return true;
  }
  
  // Check Sec-Fetch-Dest (Firefox/Chrome)
  const dest = request.headers.get('Sec-Fetch-Dest');
  if (dest && dest !== 'document' && dest !== 'empty') {
    return true;
  }
  
  // Check Sec-Fetch-Mode (additional safety)
  const mode = request.headers.get('Sec-Fetch-Mode');
  if (mode === 'no-cors' && request.mode === 'navigate') {
    return true; // Likely prefetch
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
  // 🚨 STEP 1: Skip prefetch requests to prevent NS_BINDING_ABORTED
  if (isPrefetchRequest(event.request)) {
    console.log('🔄 SW: Skipping prefetch request:', event.request.url);
    return; // Let browser handle prefetch directly
  }
  
  // 🚨 STEP 2: Skip ALL private requests - let them go to network directly
  if (SKIP(event.request.url)) {
    return; // Pass through to network without interception
  }
  
  // 🚨 STEP 3: Skip static assets to prevent corruption
  if (isStaticAsset(event.request)) {
    console.log('🚨 SW: Skipping static asset to prevent corruption:', event.request.url);
    return;
  }
  
  // STEP 4: Only handle navigation requests for offline fallback
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
  const { data } = event;
  if (!data || typeof data !== 'object') return;

  // Route warming: preload HTML for critical routes
  if (data.type === 'WARM_ROUTE' && typeof data.url === 'string') {
    const url = new URL(data.url, self.location.origin).toString();
    
    // Skip if not allowed or is prefetch-like
    if (SKIP(url)) {
      console.log('⏭️ SW: Skipping WARM_ROUTE (private):', url);
      return;
    }
    
    event.waitUntil((async () => {
      try {
        // Просто прогреваем HTTP кеш браузера, не кешируем в SW
        await fetch(url, { 
          method: 'GET', 
          credentials: 'same-origin',
          headers: { 
            'Accept': 'text/html',
            'X-SW-Warming': 'true'
          }
        });
        console.log('✅ SW: Route warmed (HTTP cache):', url);
      } catch (e) {
        console.warn('❌ SW: Route warming error:', url, e.message);
      }
    })());
  }

  // Allow skip waiting when requested
  if (data.type === 'SKIP_WAITING') {
    console.log('⏩ SW: Skip waiting requested');
    self.skipWaiting();
  }
});