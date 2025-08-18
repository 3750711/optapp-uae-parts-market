
import React, { Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Loader2 } from "lucide-react";

// Import components that might use hooks lazily
const AuthProvider = React.lazy(() => import("@/contexts/AuthContext").then(module => ({ default: module.AuthProvider })));
const AppRoutes = React.lazy(() => import("@/routes"));
const GlobalErrorBoundary = React.lazy(() => import("@/components/error/GlobalErrorBoundary").then(module => ({ default: module.GlobalErrorBoundary })));
const ProfileCompletionRedirect = React.lazy(() => import("@/components/routing/ProfileCompletionRedirect"));

// Lazy load performance monitor to avoid early hook calls
const performanceMonitor = {
  destroy: () => {
    // Safe no-op if not initialized
  }
};

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

const App = () => {
  const [isReady, setIsReady] = React.useState(false);

  useEffect(() => {
    // Initialize performance monitoring safely after component mount
    const initPerformanceMonitoring = async () => {
      if (import.meta.env.DEV) {
        try {
          const { performanceMonitor: pm } = await import("@/utils/performanceMonitor");
          // Performance monitoring initialized
        } catch (error) {
          console.warn("Failed to initialize performance monitoring:", error);
        }
      }
    };

    // Ensure React is fully initialized before setting ready state
    const initializeApp = async () => {
      await initPerformanceMonitoring();
      // Small delay to ensure React dispatcher is ready
      requestAnimationFrame(() => {
        setIsReady(true);
      });
    };

    initializeApp();

    // Cleanup on unmount
    return () => {
      performanceMonitor.destroy();
    };
  }, []);

  if (!isReady) {
    return <RouteLoader />;
  }

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<RouteLoader />}>
              <GlobalErrorBoundary showDetails={import.meta.env.DEV}>
                <AuthProvider>
                  <ProfileCompletionRedirect>
                    <Suspense fallback={<RouteLoader />}>
                      <AppRoutes />
                    </Suspense>
                  </ProfileCompletionRedirect>
                </AuthProvider>
              </GlobalErrorBoundary>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;
