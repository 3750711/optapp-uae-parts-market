
import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthErrorBoundary } from '@/components/auth/AuthErrorBoundary';
import LanguageProvider from '@/components/layout/LanguageProvider';
import { ThemeProvider } from "next-themes";
import AppRoutes from "@/routes";
import { GlobalErrorBoundary } from "@/components/error/GlobalErrorBoundary";
import { PBLogoLoader } from "@/components/ui/PBLogoLoader";
import { RoutePreloader } from "@/components/routing/RoutePreloader";
import { NetworkIndicator } from "@/components/NetworkIndicator";
import { ServiceWorkerStatus } from "@/components/ServiceWorkerStatus";
import { getQueryConfigForConnection } from "@/utils/networkUtils";

// Адаптивная конфигурация QueryClient для мобильных сетей
const networkConfig = getQueryConfigForConnection();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Различаем типы ошибок для лучшей обработки
        const isTimeoutError = error?.name === 'TimeoutError';
        const isNetworkError = error?.name === 'NetworkError' || 
                              error?.message?.includes('fetch') ||
                              error?.message?.includes('network');
        
        // На медленных сетях не ретраим, на быстрых - только 1 попытка
        return !isTimeoutError && isNetworkError && failureCount < networkConfig.retry;
      },
      staleTime: 60_000, // 60s for SWR behavior
      gcTime: networkConfig.gcTime,
      refetchOnWindowFocus: 'always', // Always refetch on focus
      refetchOnReconnect: 'always', // Always refetch on reconnect
      refetchOnMount: false, // Минимум запросов
      networkMode: 'online',
    },
    mutations: {
      retry: false,
      networkMode: 'online',
    }
  },
});

// Wake-up handler now uses proper React Query hooks instead of global access

// Компонент загрузки для lazy-loaded маршрутов
const RouteLoader = React.memo(() => (
  <PBLogoLoader />
));

const App = () => {
  return (
    <GlobalErrorBoundary showDetails={import.meta.env.DEV}>
      <HelmetProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <AuthErrorBoundary>
                <BrowserRouter>
                  <LanguageProvider>
                    <TooltipProvider>
                      <Toaster />
                      <NetworkIndicator />
                      {import.meta.env.DEV && <ServiceWorkerStatus />}
                      <Suspense fallback={<RouteLoader />}>
                        <RoutePreloader />
                        <AppRoutes />
                      </Suspense>
                    </TooltipProvider>
                  </LanguageProvider>
                </BrowserRouter>
              </AuthErrorBoundary>
            </AuthProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </HelmetProvider>
    </GlobalErrorBoundary>
  );
};

export default App;
