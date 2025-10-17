import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { preloadRoutes } from '@/utils/routePreloader';

const CRITICAL_ROUTES = [
  '/seller/dashboard',
  '/seller/orders', 
  '/seller/listings',
  '/admin',
  '/buyer-dashboard'
];

/**
 * Preloads critical routes using SW-safe strategy
 * First tries warming through Service Worker, then falls back to prefetch links
 */
export const RoutePreloader: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Small delay to avoid interfering with initial load
    const timer = setTimeout(() => {
      preloadRoutes({
        routes: CRITICAL_ROUTES,
        disablePrefetchTag: false,
        debug: true // временно включён для проверки
      });
    }, 500);
    
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return null;
};