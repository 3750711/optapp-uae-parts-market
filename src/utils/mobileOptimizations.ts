// Mobile-specific optimizations for ultra-fast performance

export const preloadCriticalAssets = () => {
  // Preload Inter font weights that are actually used
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
  fontLink.as = 'style';
  fontLink.crossOrigin = 'anonymous';
  document.head.appendChild(fontLink);

  // Preload critical routes for instant navigation
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // Preload common routes users navigate to
      const routes = [
        '/seller/add-product',
        '/seller/listings', 
        '/seller/orders'
      ];
      routes.forEach(route => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      });
    });
  }
};

export const optimizeForMobile = () => {
  // Detect PWA mode to optimize accordingly
  const isPWA = 
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    // @ts-ignore
    window.navigator.standalone === true;

  // Add viewport meta for optimal mobile rendering
  let viewport = document.querySelector('meta[name=viewport]');
  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.setAttribute('name', 'viewport');
    document.head.appendChild(viewport);
  }
  
  // PWA-optimized viewport settings
  const viewportContent = isPWA 
    ? 'width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no'
    : 'width=device-width,initial-scale=1,viewport-fit=cover';
  viewport.setAttribute('content', viewportContent);

  // Prevent zoom on input focus (iOS Safari) with PWA considerations
  const style = document.createElement('style');
  style.textContent = `
    @media screen and (max-width: 767px) {
      input[type="text"],
      input[type="email"],
      input[type="password"],
      input[type="number"],
      input[type="tel"],
      textarea,
      select {
        font-size: 16px !important;
      }
    }
    
    ${isPWA ? `
      /* PWA-specific optimizations */
      * {
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
      }
      
      input, textarea, [contenteditable] {
        -webkit-user-select: text;
        user-select: text;
      }
      
      /* Prevent pull-to-refresh in PWA */
      html {
        overscroll-behavior: contain;
      }
    ` : ''}
  `;
  document.head.appendChild(style);

  // Add passive event listeners for better scroll performance
  // Minimize for PWA to reduce bfcache blocking
  document.addEventListener('touchstart', () => {}, { passive: true });
  document.addEventListener('touchmove', () => {}, { passive: true });

  // PWA-specific optimizations
  if (isPWA) {
    // Prevent context menu in PWA
    document.addEventListener('contextmenu', (e) => e.preventDefault(), { passive: false });
    
    // Optimize memory for PWA
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Pause non-essential animations
        document.querySelectorAll('video, audio').forEach((media: any) => {
          if (!media.paused) {
            media.pause();
            media.dataset.pwaAutoPaused = 'true';
          }
        });
      } else {
        // Resume animations
        document.querySelectorAll('[data-pwa-auto-paused]').forEach((media: any) => {
          if (media.dataset.pwaAutoPaused === 'true') {
            media.play().catch(() => {});
            delete media.dataset.pwaAutoPaused;
          }
        });
      }
    }, { passive: true });
  }
};

export const initMobileOptimizations = () => {
  if (typeof window !== 'undefined') {
    preloadCriticalAssets();
    optimizeForMobile();
    
    // Initialize PWA-specific optimizations
    const isPWA = 
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: window-controls-overlay)').matches ||
      // @ts-ignore
      window.navigator.standalone === true;
      
    if (isPWA) {
      console.log('🏠 PWA mode detected - applying PWA optimizations');
      
      // Import and initialize PWA optimizations dynamically
      import('./pwaOptimizations').then(({ pwaOptimizer }) => {
        console.log('🏠 PWA optimizations loaded:', pwaOptimizer.getOptimizationStatus());
      }).catch(error => {
        console.warn('🏠 Failed to load PWA optimizations:', error);
      });
    }
  }
};