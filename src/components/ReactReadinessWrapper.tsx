import React from 'react';

interface ReactReadinessWrapperProps {
  children: React.ReactNode;
}

/**
 * Simplified wrapper - dispatcher check now happens in main.tsx before React renders
 * This component is now just a passthrough since pre-render checks ensure React is ready
 */
export const ReactReadinessWrapper: React.FC<ReactReadinessWrapperProps> = ({ 
  children 
}) => {
  // Since dispatcher check happens in main.tsx before any React rendering,
  // we can safely assume React is ready by the time this component renders
  console.log('✅ [ReactReadinessWrapper] React confirmed ready, rendering children');
  
  return <>{children}</>;
};