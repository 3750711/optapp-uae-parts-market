import { useEffect } from 'react';
import { logClientError } from '@/utils/activityLogger';

/**
 * Global error handler for capturing unhandled errors and promise rejections
 */
export const useGlobalErrorHandler = () => {
  useEffect(() => {
    // Handle uncaught JavaScript errors
    const handleError = (event: ErrorEvent) => {
      logClientError(event.error || event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'javascript_error'
      });
    };

    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logClientError(event.reason, {
        type: 'unhandled_promise_rejection',
        promise: 'Promise rejection not handled'
      });
    };

    // Add event listeners
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
};