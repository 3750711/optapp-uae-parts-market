
import React, { Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from '@/contexts/AuthContext';
import { RealtimeProvider } from '@/contexts/RealtimeProvider';
import LanguageProvider from '@/components/layout/LanguageProvider';
import { ThemeProvider } from "next-themes";
import AppRoutes from "@/routes";
import ErrorBoundary from "@/components/ErrorBoundary";
import { performanceMonitor } from "@/utils/performanceMonitor";
import { PWAIndicators } from "@/components/PWAIndicators";
import { useBackgroundSync } from "@/hooks/useBackgroundSync";
import { PBLogoLoader } from "@/components/ui/PBLogoLoader";
import { RouteChangeOverlay } from "@/components/routing/RouteChangeOverlay";
import { UpdatePrompt } from "@/components/UpdatePrompt";
import { NetworkStatus } from "@/components/ui/NetworkStatus";
import { useNetworkHandler } from "@/hooks/useNetworkHandler";
// Оптимизированная конфигурация QueryClient для production
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Не повторяем при авторизационных ошибках
        if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
          return false;
        }
        return failureCount < 1; // Уменьшено для быстрого fallback в офлайн
      },
      staleTime: 5 * 60 * 1000, // Уменьшено до 5 минут для более актуальных данных о предложениях
      gcTime: 30 * 60 * 1000, // 30 минут в памяти
      refetchOnWindowFocus: false, // Отключено для производительности
      refetchOnReconnect: false, // Отключено для офлайн режима
      refetchOnMount: true, // Включено для получения актуальных данных о предложениях
    },
    mutations: {
      retry: false, // Не повторяем мутации автоматически
    }
  },
});

// Компонент загрузки для lazy-loaded маршрутов
const RouteLoader = React.memo(() => (
  <PBLogoLoader />
));

// App content component with background sync logic
const AppContent = React.memo(() => {
  const { processSyncQueue } = useBackgroundSync();
  
  useEffect(() => {
    // Initialize performance monitoring in development
    if (import.meta.env.DEV) {
      // Performance monitoring initialized
    }

    // Listen for SW messages about background sync
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'BACKGROUND_SYNC') {
        console.log('📱 App: Background sync requested');
        processSyncQueue().catch(console.error);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }

    // Process sync queue when coming online
    const handleOnline = () => {
      console.log('🌐 App: Back online, processing sync queue');
      processSyncQueue().catch(console.error);
    };

    window.addEventListener('online', handleOnline);

    // Cleanup on unmount
    return () => {
      performanceMonitor.destroy();
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
      window.removeEventListener('online', handleOnline);
    };
  }, [processSyncQueue]);

  return (
    <ErrorBoundary fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-semibold">Ошибка подключения</h1>
          <p className="text-muted-foreground">Проверьте подключение к интернету</p>
        </div>
      </div>
    }>
      <RealtimeProvider>
        <BrowserRouter>
          <LanguageProvider>
            <TooltipProvider>
              <NetworkHandler />
              <Toaster />
              <RouteChangeOverlay />
              <UpdatePrompt />
              <NetworkStatus data-network-status />
              <Suspense fallback={<RouteLoader />}>
                <AppRoutes />
                <PWAIndicators 
                  showOfflineIndicator={false} 
                  showInstallStatus={false} 
                />
              </Suspense>
            </TooltipProvider>
          </LanguageProvider>
        </BrowserRouter>
      </RealtimeProvider>
    </ErrorBoundary>
  );
});

// Network handler component - moved outside for proper provider order
const NetworkHandler = React.memo(() => {
  useNetworkHandler();
  return null;
});

const App = () => {
  return (
    <ErrorBoundary 
      onError={(error, errorInfo) => {
        console.error('🔴 Critical app error:', error, errorInfo.componentStack);
      }}
    >
      <HelmetProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <QueryClientProvider client={queryClient}>
            <ErrorBoundary fallback={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                  <h1 className="text-xl font-semibold">Ошибка инициализации</h1>
                  <p className="text-muted-foreground">Попробуйте обновить страницу</p>
                </div>
              </div>
            }>
              <AuthProvider>
                <AppContent />
              </AuthProvider>
            </ErrorBoundary>
          </QueryClientProvider>
        </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

export default App;
