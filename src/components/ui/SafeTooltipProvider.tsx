import React, { useEffect, useState } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { runReactDiagnostics } from '@/utils/reactDiagnostics';

interface SafeTooltipProviderProps {
  children: React.ReactNode;
}

/**
 * Safe wrapper for TooltipProvider that ensures React dispatcher is ready
 * before rendering Radix components that use hooks
 */
export const SafeTooltipProvider: React.FC<SafeTooltipProviderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const checkReadiness = () => {
      const diagnostics = runReactDiagnostics();
      
      if (diagnostics.internalState === 'ready' && diagnostics.dispatcherExists) {
        console.log('✅ [SafeTooltipProvider] React dispatcher ready');
        setIsReady(true);
        return;
      }

      if (retryCount < 5) {
        console.warn(`⚠️ [SafeTooltipProvider] Dispatcher not ready, retry ${retryCount + 1}/5`, diagnostics);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 100);
      } else {
        console.error('❌ [SafeTooltipProvider] Max retries reached, rendering without tooltips');
        setIsReady(true); // Render without tooltips
      }
    };

    checkReadiness();
  }, [retryCount]);

  // If React isn't ready and we haven't exceeded retries, show loading
  if (!isReady) {
    return <>{children}</>;
  }

  // If dispatcher is confirmed ready or we've given up, render with TooltipProvider
  const diagnostics = runReactDiagnostics();
  if (diagnostics.dispatcherExists && diagnostics.internalState === 'ready') {
    return (
      <TooltipProvider>
        {children}
      </TooltipProvider>
    );
  }

  // Fallback: render without TooltipProvider to avoid crashes
  console.warn('⚠️ [SafeTooltipProvider] Rendering without tooltips due to dispatcher issues');
  return <>{children}</>;
};