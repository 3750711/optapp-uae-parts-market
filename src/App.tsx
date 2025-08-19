
import React, { Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from '@/contexts/AuthContext';
import { RealtimeProvider } from '@/contexts/RealtimeProvider';

import { ThemeProvider } from "next-themes";
import AppRoutes from "@/routes";
import { Loader2 } from "lucide-react";
import { GlobalErrorBoundary } from "@/components/error/GlobalErrorBoundary";
import { performanceMonitor } from "@/utils/performanceMonitor";
import { PWAIndicators } from "@/components/PWAIndicators";
import { useBackgroundSync } from "@/hooks/useBackgroundSync";
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
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-optapp-yellow mx-auto" />
      <p className="text-sm text-gray-600">Загрузка...</p>
    </div>
  </div>
));

const App = () => {
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
    <GlobalErrorBoundary showDetails={import.meta.env.DEV}>
      <HelmetProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <RealtimeProvider>
                <BrowserRouter>
                  <TooltipProvider>
                    <Toaster />
                     <Suspense fallback={<RouteLoader />}>
                       <AppRoutes />
                        <PWAIndicators 
                          showOfflineIndicator={false} 
                          showInstallStatus={false} 
                        />
                     </Suspense>
                  </TooltipProvider>
                </BrowserRouter>
              </RealtimeProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </HelmetProvider>
    </GlobalErrorBoundary>
  );
};

export default App;
