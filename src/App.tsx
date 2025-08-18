import React, { Suspense, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import AppRoutes from "@/routes";
import { Loader2 } from "lucide-react";
import { GlobalErrorBoundary } from "@/components/error/GlobalErrorBoundary";
import { performanceMonitor } from "@/utils/performanceMonitor";
import ProfileCompletionRedirect from "@/components/routing/ProfileCompletionRedirect";

// Оптимизированная конфигурация QueryClient для production
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Не повторяем при авторизационных ошибках
        if (error?.message?.includes('JWT') || error?.message?.includes('auth')) {
          return false;
        }
        return failureCount < 2; // Уменьшено количество повторов
      },
      staleTime: 5 * 60 * 1000, // Уменьшено до 5 минут для более актуальных данных о предложениях
      gcTime: 30 * 60 * 1000, // 30 минут в памяти
      refetchOnWindowFocus: false, // Отключено для производительности
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

// Safe wrapper for toast components that only render when React is ready
const SafeToastProviders = ({ children }: { children: React.ReactNode }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ensure React is fully initialized before rendering toast components
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {isReady && (
        <>
          <Toaster />
          <Sonner />
        </>
      )}
      {children}
    </>
  );
};

// Safe TooltipProvider wrapper that only renders when React is ready
const SafeTooltipProvider = ({ children }: { children: React.ReactNode }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ensure React is fully initialized before rendering TooltipProvider
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return <>{children}</>;
  }

  try {
    return <TooltipProvider>{children}</TooltipProvider>;
  } catch (error) {
    console.warn('TooltipProvider failed to initialize, falling back without tooltips:', error);
    return <>{children}</>;
  }
};

const App = () => {
  useEffect(() => {
    // Initialize performance monitoring in development
    if (import.meta.env.DEV) {
      // Performance monitoring initialized
    }

    // Cleanup on unmount
    return () => {
      performanceMonitor.destroy();
    };
  }, []);

  return (
    <GlobalErrorBoundary showDetails={import.meta.env.DEV}>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <SafeTooltipProvider>
            <SafeToastProviders>
              <BrowserRouter>
                <AuthProvider>
                  <ProfileCompletionRedirect>
                    <Suspense fallback={<RouteLoader />}>
                      <AppRoutes />
                    </Suspense>
                  </ProfileCompletionRedirect>
                </AuthProvider>
              </BrowserRouter>
            </SafeToastProviders>
          </SafeTooltipProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </GlobalErrorBoundary>
  );
};

export default App;
