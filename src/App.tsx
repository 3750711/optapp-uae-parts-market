
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
