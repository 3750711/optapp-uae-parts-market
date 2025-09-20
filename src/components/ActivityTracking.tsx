import React from 'react';
import { usePageViewTracker } from '@/hooks/usePageViewTracker';
import { useGlobalErrorHandler } from '@/hooks/useGlobalErrorHandler';

/**
 * Component that handles activity tracking hooks
 * Should be placed inside BrowserRouter but outside route components
 */
export const ActivityTracking: React.FC = () => {
  // Track page views
  usePageViewTracker();
  
  // Handle global errors
  useGlobalErrorHandler();
  
  // This component doesn't render anything
  return null;
};