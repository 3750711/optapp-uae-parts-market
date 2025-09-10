import React, { useEffect, useState } from 'react';
import { runReactDiagnostics } from '@/utils/reactDiagnostics';

interface AppInitializerProps {
  children: React.ReactNode;
}

/**
 * Handles app initialization AFTER React starts rendering
 * This is the correct place to check dispatcher readiness
 */
export const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const initializeApp = () => {
      try {
        const diagnostics = runReactDiagnostics();
        console.log('✅ [AppInitializer] React diagnostics:', diagnostics);
        
        // Now that we're inside React, dispatcher should be available
        if (diagnostics.dispatcherExists) {
          console.log('✅ [AppInitializer] React dispatcher confirmed ready');
          setIsReady(true);
          return;
        }

        // Retry a few times if dispatcher not ready
        if (retryCount < 3) {
          console.warn(`⚠️ [AppInitializer] Dispatcher not ready, retry ${retryCount + 1}/3`);
          setTimeout(() => setRetryCount(prev => prev + 1), 100);
        } else {
          console.warn('⚠️ [AppInitializer] Max retries reached, proceeding anyway');
          setIsReady(true);
        }
      } catch (error) {
        console.error('❌ [AppInitializer] Initialization error:', error);
        setIsReady(true); // Proceed anyway to avoid infinite loading
      }
    };

    initializeApp();
  }, [retryCount]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Инициализация приложения...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};