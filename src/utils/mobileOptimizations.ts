// Mobile-specific optimizations for ultra-fast performance

export const preloadCriticalAssets = () => {
  // Preload Inter font weights that are actually used
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
  fontLink.as = 'style';
  fontLink.crossOrigin = 'anonymous';
  document.head.appendChild(fontLink);
};

export const optimizeForMobile = () => {
  // Detect PWA mode to optimize accordingly
  const isPWA = 
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    // @ts-ignore
    window.navigator.standalone === true;

  // ============================================
  // 🌍 УНИВЕРСАЛЬНЫЕ оптимизации (для всех)
  // ============================================
  
  // 1. Viewport meta - работает везде
  let viewport = document.querySelector('meta[name=viewport]');
  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.setAttribute('name', 'viewport');
    document.head.appendChild(viewport);
  }
  
  // Адаптивный viewport (user-scalable=no только в PWA)
  const viewportContent = isPWA 
    ? 'width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no'
    : 'width=device-width,initial-scale=1,viewport-fit=cover';
  viewport.setAttribute('content', viewportContent);

  // 2. Предотвращение zoom на input focus (iOS Safari) - работает везде
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
    
    /* File inputs - работают везде */
    input[type="file"] {
      pointer-events: auto !important;
      touch-action: manipulation;
    }
    
    ${isPWA ? `
      /* 🏠 PWA-специфичные стили */
      * {
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
      }
      
      input, textarea, [contenteditable] {
        -webkit-user-select: text;
        user-select: text;
      }
      
      /* Exception for file inputs in PWA */
      input[type="file"] {
        -webkit-touch-callout: default;
        -webkit-user-select: none;
        user-select: none;
      }
      
      /* Prevent pull-to-refresh in PWA */
      html {
        overscroll-behavior: contain;
      }
    ` : ''}
  `;
  document.head.appendChild(style);

  // 3. Passive listeners (нужны везде для производительности)
  document.addEventListener('touchstart', () => {}, { passive: true });
  document.addEventListener('touchmove', () => {}, { passive: true });

  // ============================================
  // 🏠 PWA-СПЕЦИФИЧНЫЕ оптимизации
  // ============================================
  
  if (isPWA) {
    // Context menu prevention - только в PWA
    document.addEventListener('contextmenu', (e) => e.preventDefault(), { passive: false });
    
    // Memory optimization через visibilitychange - только в PWA
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