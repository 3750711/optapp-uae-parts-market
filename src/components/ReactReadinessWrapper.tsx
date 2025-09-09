import React, { useEffect, useState, useRef } from 'react';
import { PBLogoLoader } from '@/components/ui/PBLogoLoader';

interface ReactReadinessWrapperProps {
  children: React.ReactNode;
  timeout?: number;
}

/**
 * Ensures React dispatcher is initialized before rendering children
 * Fixes "dispatcher is null" error on slow network connections
 */
export const ReactReadinessWrapper: React.FC<ReactReadinessWrapperProps> = ({ 
  children, 
  timeout = 10000 
}) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const checkCount = useRef(0);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

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
          useEffectAvailable: typeof React.useEffect === 'function'
        });
        setIsReady(true);
        return true;
      }
    } catch (error) {
      console.warn(`⚠️ [ReactReadiness] Check #${checkCount.current} failed:`, error);
    }
    
    return false;
  };

    // Initial check
    if (!checkReactDispatcher()) {
      // Poll every 100ms until ready
      const interval = setInterval(() => {
        if (checkReactDispatcher() || checkCount.current >= 50) { // Max 5 seconds
          clearInterval(interval);
        }
      }, 100);

      // Timeout fallback
      timeoutId = setTimeout(() => {
        if (!isReady && mounted) {
          console.error('❌ [ReactReadiness] Timeout waiting for React dispatcher');
          setError('React initialization timeout');
        }
      }, timeout);
    }

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [timeout]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-lg p-6 border shadow-sm text-center">
          <h2 className="text-lg font-semibold text-destructive mb-4">
            Ошибка инициализации React
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            React dispatcher не инициализирован. Обновите страницу.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md"
          >
            Обновить страницу
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