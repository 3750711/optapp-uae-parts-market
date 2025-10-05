import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { logPageView } from '@/utils/activityLogger';

/**
 * Component that automatically tracks page views when route changes
 * Uses debouncing to avoid excessive logging on rapid navigation
 */
export const ActivityTracker = () => {
  const location = useLocation();
  const debounceRef = useRef<NodeJS.Timeout>();
  const lastPathRef = useRef<string>('');

  useEffect(() => {
    const currentPath = location.pathname + location.search;
    
    // Skip if same path (prevent duplicate logs on re-renders)
    if (lastPathRef.current === currentPath) {
      return;
    }

    // Clear previous debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce page view logging by 300ms
    debounceRef.current = setTimeout(() => {
      // Skip admin tools and very short paths that might be navigation artifacts
      if (currentPath.length > 1 && !currentPath.includes('/admin/tools/')) {
        logPageView(currentPath, {
          referrer: lastPathRef.current || 'direct',
          timestamp: new Date().toISOString()
        });
        
        lastPathRef.current = currentPath;
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [location.pathname, location.search]);

  return null;
};
