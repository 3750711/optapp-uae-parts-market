import React, { useEffect, useState, useRef } from 'react';
import { PBLogoLoader } from '@/components/ui/PBLogoLoader';
import { logReactDiagnostics } from '@/utils/reactDiagnostics';

interface ReactReadinessWrapperProps {
  children: React.ReactNode;
  timeout?: number;
}

/**
 * Ensures React dispatcher is initialized before rendering children
 * Fixes "dispatcher is null" error on slow network connections with retry logic
 */
export const ReactReadinessWrapper: React.FC<ReactReadinessWrapperProps> = ({ 
  children, 
  timeout = 10000 
}) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const checkCount = useRef(0);
  const maxRetries = 5;

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    // Log initial diagnostics
    logReactDiagnostics('ReactReadinessWrapper - Initial');

    const checkReactDispatcher = () => {
      checkCount.current++;
      
      try {
        // Deep check - actually try to execute a hook in a test component
        const TestComponent = () => {
          const [testState, setTestState] = React.useState(true);
          React.useEffect(() => {
            setTestState(false);
          }, []);
          return null;
        };
        
        // Check if React internals are ready
        const ReactInternals = (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
        const dispatcher = ReactInternals?.ReactCurrentDispatcher?.current;
        
        if (dispatcher && typeof React.useState === 'function' && mounted) {
          console.log(`✅ [ReactReadiness] Check #${checkCount.current}: React dispatcher ready`, {
            dispatcherExists: !!dispatcher,
            useStateAvailable: typeof React.useState === 'function',
            useEffectAvailable: typeof React.useEffect === 'function',
            retryAttempt
          });
          setIsReady(true);
          return true;
        } else {
          console.warn(`⚠️ [ReactReadiness] Check #${checkCount.current}: Dispatcher not ready`, {
            dispatcherExists: !!dispatcher,
            useStateType: typeof React.useState,
            retryAttempt
          });
        }
      } catch (error) {
        console.warn(`⚠️ [ReactReadiness] Check #${checkCount.current} failed:`, error, { retryAttempt });
      }
      
      return false;
    };

    // Initial check with retry logic
    if (!checkReactDispatcher()) {
      console.log(`🔄 [ReactReadiness] Initial check failed, starting polling (attempt ${retryAttempt + 1}/${maxRetries})`);
      
      // Poll every 100ms until ready
      const interval = setInterval(() => {
        if (checkReactDispatcher() || checkCount.current >= 50) { // Max 5 seconds of polling
          clearInterval(interval);
          
          // If still not ready after polling, try retry
          if (!isReady && retryAttempt < maxRetries - 1) {
            console.log(`🔄 [ReactReadiness] Polling failed, retrying (${retryAttempt + 1}/${maxRetries})`);
            setTimeout(() => {
              if (mounted) {
                setRetryAttempt(prev => prev + 1);
                checkCount.current = 0; // Reset check count for new attempt
              }
            }, 500 * (retryAttempt + 1)); // Progressive delay
          }
        }
      }, 100);

      // Timeout fallback
      timeoutId = setTimeout(() => {
        if (!isReady && mounted) {
          console.error(`❌ [ReactReadiness] Timeout waiting for React dispatcher after ${retryAttempt + 1} attempts`);
          setError(`React initialization timeout (${retryAttempt + 1}/${maxRetries} attempts)`);
        }
      }, timeout);
    }

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [timeout, retryAttempt]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-lg p-6 border shadow-sm text-center">
          <h2 className="text-lg font-semibold text-destructive mb-4">
            Ошибка инициализации React
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            React dispatcher не инициализирован после {maxRetries} попыток. Обновите страницу.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md mr-2"
          >
            Обновить страницу
          </button>
          <button 
            onClick={() => {
              setError(null);
              setRetryAttempt(0);
              checkCount.current = 0;
            }}
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md"
          >
            Попробовать еще раз
          </button>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return <PBLogoLoader />;
  }

  return <>{children}</>;
};