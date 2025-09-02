
import React, { Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from '@/contexts/AuthContext';
import { RealtimeProvider } from '@/contexts/RealtimeProvider.noop';
import LanguageProvider from '@/components/layout/LanguageProvider';

import { ThemeProvider } from "next-themes";
import AppRoutes from "@/routes";
import { GlobalErrorBoundary } from "@/components/error/GlobalErrorBoundary";
import { performanceMonitor } from "@/utils/performanceMonitor";
import { PWAIndicators } from "@/components/PWAIndicators";
import { useBackgroundSync } from "@/hooks/useBackgroundSync";
import { PBLogoLoader } from "@/components/ui/PBLogoLoader";
import { RouteChangeOverlay } from "@/components/routing/RouteChangeOverlay";
import { UpdatePrompt } from "@/components/UpdatePrompt";
// Консервативная конфигурация QueryClient для стабильности мобильных сетей
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Только 1 попытка, только на сетевые ошибки
        const isNetworkError = error?.name === 'NetworkError' || 
                              error?.message?.includes('fetch') ||
                              error?.message?.includes('network');
        return isNetworkError && failureCount < 1;
      },
      staleTime: 10 * 60 * 1000, // 10 минут - консервативно
      gcTime: 60 * 60 * 1000, // 1 час в памяти
      refetchOnWindowFocus: false, 
      refetchOnReconnect: false, 
      refetchOnMount: false, // Отключено для минимума запросов
      networkMode: 'online', // Только онлайн режим
    },
    mutations: {
      retry: false,
      networkMode: 'online',
    }
  },
});

// Компонент загрузки для lazy-loaded маршрутов
const RouteLoader = React.memo(() => (
  <PBLogoLoader />
));

const App = () => {
  // 🔧 УПРОЩЕНО: Убраны все сложные инициализации для Safe Baseline

  return (
    <GlobalErrorBoundary showDetails={import.meta.env.DEV}>
      <HelmetProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <AuthProvider>
            <RealtimeProvider>
              <BrowserRouter>
                <LanguageProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Suspense fallback={<RouteLoader />}>
                      <AppRoutes />
                    </Suspense>
                  </TooltipProvider>
                </LanguageProvider>
              </BrowserRouter>
            </RealtimeProvider>
          </AuthProvider>
        </ThemeProvider>
      </HelmetProvider>
    </GlobalErrorBoundary>
  );
};

export default App;
