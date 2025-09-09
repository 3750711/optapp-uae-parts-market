import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const CRITICAL_ROUTES = [
  '/seller/dashboard',
  '/seller/orders', 
  '/seller/listings',
  '/admin',
  '/buyer-dashboard'
];

/**
 * Preloads critical routes to prevent NS_BINDING_ABORTED errors
 * This helps with route transitions and reduces loading delays
 */
export const RoutePreloader: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Preload critical routes after authentication
    const preloadRoutes = () => {
      CRITICAL_ROUTES.forEach(route => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        
        // Only add if not already added
        if (!document.querySelector(`link[href="${route}"]`)) {
          document.head.appendChild(link);
          console.log('🚀 [RoutePreloader] Prefetching route:', route);
        }
      });
    };

    // Small delay to avoid interfering with initial load
    const timer = setTimeout(preloadRoutes, 1000);
    
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return null;
};