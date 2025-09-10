import React, { useEffect, useState } from 'react';
import { runReactDiagnostics } from '@/utils/reactDiagnostics';
import { trackRender } from '@/utils/performanceDiagnostics';

interface ReactReadinessWrapperProps {
  children: React.ReactNode;
}

/**
 * Enhanced wrapper that verifies React dispatcher is ready before rendering children
 * Provides graceful fallback for initialization issues
 */
export const ReactReadinessWrapper: React.FC<ReactReadinessWrapperProps> = ({ 
  children 
}) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackRender('ReactReadinessWrapper');
    
    const verifyReactReadiness = () => {
      try {
        const diagnostics = runReactDiagnostics();
        
        if (diagnostics.internalState === 'ready' && diagnostics.dispatcherExists) {
          console.log('✅ [ReactReadinessWrapper] React fully ready', diagnostics);
          setIsReady(true);
          setError(null);
        } else {
          console.warn('⚠️ [ReactReadinessWrapper] React not fully ready', diagnostics);
          setError(`React state: ${diagnostics.internalState}, dispatcher: ${diagnostics.dispatcherExists}`);
          
          // Retry after a short delay
          setTimeout(() => {
            const retryDiagnostics = runReactDiagnostics();
            if (retryDiagnostics.internalState === 'ready') {
              setIsReady(true);
              setError(null);
            }
          }, 50);
        }
      } catch (err) {
        console.error('❌ [ReactReadinessWrapper] Error checking React readiness:', err);
        setError(`Check failed: ${err}`);
        // Still try to render to avoid blank screen
        setIsReady(true);
      }
    };

    verifyReactReadiness();
  }, []);

  // Show loading state while checking readiness
  if (!isReady) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'system-ui'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div>Инициализация React...</div>
          {error && (
            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};