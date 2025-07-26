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
  // Add viewport meta for optimal mobile rendering
  let viewport = document.querySelector('meta[name=viewport]');
  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.setAttribute('name', 'viewport');
    document.head.appendChild(viewport);
  }
  viewport.setAttribute('content', 'width=device-width,initial-scale=1,viewport-fit=cover');

  // Prevent zoom on input focus (iOS Safari)
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
  `;
  document.head.appendChild(style);

  // Add passive event listeners for better scroll performance
  document.addEventListener('touchstart', () => {}, { passive: true });
  document.addEventListener('touchmove', () => {}, { passive: true });
};

export const initMobileOptimizations = () => {
  if (typeof window !== 'undefined') {
    preloadCriticalAssets();
    optimizeForMobile();
  }
};