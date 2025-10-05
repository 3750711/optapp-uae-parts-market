import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { logPageView } from '@/utils/activityLogger';

/**
 * Hook for tracking page views with immediate logging
 */
export const usePageViewTracker = () => {
  const location = useLocation();
  const lastPathRef = useRef<string>('');

  useEffect(() => {
    const currentPath = location.pathname + location.search;
    
    console.log('🔍 [PageViewTracker] Path changed:', currentPath);
    
    // Skip if same path (prevent duplicate logs on re-renders)
    if (lastPathRef.current === currentPath) {
      return;
    }

    // Skip admin tools and very short paths that might be navigation artifacts
    if (currentPath.length > 1 && !currentPath.includes('/admin/tools/')) {
      // Immediate logging for page_view events
      logPageView(currentPath, {
        referrer: lastPathRef.current || 'direct',
        timestamp: new Date().toISOString()
      });
      
      lastPathRef.current = currentPath;
    }
  }, [location.pathname, location.search]);
};